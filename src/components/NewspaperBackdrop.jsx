import { useEffect, useRef } from 'react';
import { useArticles } from '../hooks/useArticles';
import { useTheme } from '../contexts/theme';
import { fillSteps, drawFill, mulberry32, clipRegion, pickReplacement, easeOutQuart, EDGES } from '../utils/textFill';
import { buildVocabulary, collectBlocked, measureText, readFaces } from '../utils/backdropDom';
import { prefersReducedMotion, WIPE_MS } from '../utils/wordWipe';

/**
 * Generated background type that fills every empty space of the page, word-wrap style: around and
 * between headings, paragraphs, links, the section links and the nameplate. Words are set at
 * 0/90/180/270 degrees with a 2px gap and never touch real content.
 *
 * - Each page and theme gets a freshly generated composition (a new seed per "edition").
 * - Words wipe in all at once from random directions, wipe out with the page on navigation, and
 *   tiles wipe in as they scroll into view.
 * - Every few seconds a few on-screen words wipe out and are replaced by new words that fit inside
 *   the same box, so the page keeps composing itself without ever overlapping.
 *
 * The layer covers the whole layout (it scrolls with the page) and is split into canvas tiles that
 * are filled only near the viewport. Each tile keeps an offscreen copy of its finished type;
 * animations copy clipped slices of that copy, so a frame never re-renders text. Real content is
 * measured from the DOM (utils/backdropDom.js). Decorative only: aria-hidden, no pointer events,
 * washed out with CSS opacity. Reduced motion: drawn instantly, no ambient changes.
 */

const TILE = 1024;
const AMBIENT_EVERY_MS = 3500;
const AMBIENT_SHARE = 0.03; // share of a visible tile's words that change per round
const SWAP_OUT_MS = 320;
const SWAP_IN_MS = 420;

const idle = (fn) =>
  typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(fn, { timeout: 800 }) : setTimeout(fn, 16);
const cancelIdle = (h) =>
  typeof window.cancelIdleCallback === 'function' ? window.cancelIdleCallback(h) : clearTimeout(h);

const newSeed = () => Math.floor(Math.random() * 2 ** 31);

const NewspaperBackdrop = () => {
  const layerRef = useRef(null);
  const { articles } = useArticles();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const layer = layerRef.current;
    const host = layer?.parentElement;
    if (!layer || !host || !articles.length) return undefined;

    // Fonts follow the page skin; refreshed in place on every refill
    const faces = readFaces();
    const vocabulary = buildVocabulary(articles, faces);
    // tile: { canvas, off, index, dirty, visible, fresh, placed, ratio, width, height }
    const tiles = [];
    let blocked = null;
    let version = 0;
    let edition = newSeed(); // changes per page and theme: a new composition each time
    let handle = null;
    let debounce = null;
    let busy = false;
    const animations = new Set();
    let frame = null;
    const random = Math.random;

    // --backdrop-ink lets a skin colour the background type (Flightline uses its sky blue)
    const ink = () => {
      const cs = getComputedStyle(document.documentElement);
      return cs.getPropertyValue('--backdrop-ink').trim() || cs.getPropertyValue('--ink').trim() || '#1A1A1A';
    };
    const reduced = prefersReducedMotion();

    // ---- Animation loop: copies clipped slices of each tile's offscreen copy ----
    const visibleCtx = (tile) => {
      const ctx = tile.canvas.getContext('2d');
      if (ctx) ctx.setTransform(1, 0, 0, 1, 0, 0);
      return ctx;
    };

    const paintSlice = (tile, p, edge, fraction) => {
      const ctx = visibleCtx(tile);
      if (!ctx) return;
      const r = tile.ratio;
      // 1px margin covers glyph overhang; the 2px gap keeps neighbours untouched
      const box = { x: (p.x - 1) * r, y: (p.y - 1) * r, w: (p.w + 2) * r, h: (p.h + 2) * r };
      ctx.clearRect(box.x, box.y, box.w, box.h);
      const c = clipRegion(box, edge, fraction);
      if (c.w >= 1 && c.h >= 1) ctx.drawImage(tile.off, c.x, c.y, c.w, c.h, c.x, c.y, c.w, c.h);
    };

    const tick = (now) => {
      frame = null;
      for (const a of animations) {
        if (!tiles.includes(a.tile)) {
          animations.delete(a);
          continue;
        }
        const t = (now - a.start) / a.duration;
        if (t < 0) continue;
        const e = easeOutQuart(t);
        paintSlice(a.tile, a.p, a.edge, a.mode === 'in' ? e : 1 - e);
        if (t >= 1) {
          animations.delete(a);
          a.done?.();
        }
      }
      if (animations.size) frame = requestAnimationFrame(tick);
    };

    const animate = (tile, p, mode, duration, delay = 0, done) => {
      animations.add({ tile, p, mode, duration, start: performance.now() + delay, edge: EDGES[Math.floor(random() * 4)], done });
      frame ??= requestAnimationFrame(tick);
    };

    const cancelTileAnimations = (tile) => {
      for (const a of animations) if (a.tile === tile) animations.delete(a);
    };

    // Show a tile's offscreen copy: wipe every word in at once, or copy instantly
    const reveal = (tile, wipe) => {
      cancelTileAnimations(tile);
      const ctx = visibleCtx(tile);
      if (!ctx) return;
      if (!wipe || reduced) {
        ctx.clearRect(0, 0, tile.canvas.width, tile.canvas.height);
        ctx.drawImage(tile.off, 0, 0);
        return;
      }
      ctx.clearRect(0, 0, tile.canvas.width, tile.canvas.height);
      tile.placed.forEach((p) => animate(tile, p, 'in', WIPE_MS));
    };

    // Wipe every drawn word out (navigation); the visible canvas ends empty
    const wipeOutAll = () => {
      tiles.forEach((tile) => {
        cancelTileAnimations(tile);
        if (!tile.placed || reduced || !(tile.visible || nearViewport(tile))) {
          visibleCtx(tile)?.clearRect(0, 0, tile.canvas.width, tile.canvas.height);
          return;
        }
        tile.placed.forEach((p) => animate(tile, p, 'out', WIPE_MS));
      });
    };

    // ---- Idle-time work: measuring content and packing words ----
    // Run a generator in idle time, using what the browser offers (capped at 40ms so it never becomes
    // a long task); stale runs stop when `version` moves on
    const runSliced = (gen, myVersion, done) => {
      const step = (deadline) => {
        if (myVersion !== version) {
          busy = false;
          return;
        }
        const offered = typeof deadline?.timeRemaining === 'function' ? deadline.timeRemaining() : 8;
        const until = performance.now() + Math.min(40, Math.max(8, offered));
        let r = gen.next();
        while (!r.done && performance.now() < until) r = gen.next();
        if (r.done) done(r.value);
        else handle = idle(step);
      };
      handle = idle(step);
    };

    // A tile is worth filling when it is within ~600px of the viewport. Measured from geometry so it
    // works even where IntersectionObserver is paused (background tabs); the observer only wakes
    // this up on scroll.
    function nearViewport(tile) {
      const top = layer.getBoundingClientRect().top + tile.index * TILE;
      return top < window.innerHeight + 600 && top + TILE > -600;
    }

    const fillNextTile = () => {
      if (busy) return;
      const tile = tiles.find((t) => t.dirty && (t.visible || nearViewport(t)));
      if (!tile || !blocked) return;
      busy = true;
      const myVersion = version;
      const width = layer.clientWidth;
      const top = tile.index * TILE;
      const height = Math.min(TILE, layer.clientHeight - top);
      const local = blocked
        .filter((r) => r.bottom > top && r.top < top + height)
        .map((r) => ({ left: r.left, right: r.right, top: r.top - top, bottom: r.bottom - top }));
      const steps = fillSteps({
        width,
        height,
        blocked: local,
        words: vocabulary,
        measure: measureText,
        // Same edition and tile give the same layout, so in-place refreshes (typing, data) barely move
        random: mulberry32((edition ^ (tile.index * 2654435761)) + width),
      });
      runSliced(steps, myVersion, (placed) => {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const { canvas } = tile;
        tile.off ??= document.createElement('canvas');
        for (const c of [canvas, tile.off]) {
          c.width = Math.round(width * ratio);
          c.height = Math.round(height * ratio);
        }
        canvas.style.height = `${height}px`;
        const offCtx = tile.off.getContext('2d');
        if (offCtx) {
          offCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
          offCtx.clearRect(0, 0, width, height);
          drawFill(offCtx, placed, ink());
        }
        Object.assign(tile, { placed, ratio, width, height, dirty: false });
        canvas.classList.add('is-drawn');
        reveal(tile, tile.fresh);
        tile.fresh = false;
        busy = false;
        fillNextTile();
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const tile = tiles.find((t) => t.canvas === e.target);
          if (tile) tile.visible = e.isIntersecting;
        });
        fillNextTile();
      },
      { rootMargin: '600px 0px' }
    );

    // Match the tile count to the page height
    const syncTiles = () => {
      const count = Math.max(1, Math.ceil(layer.clientHeight / TILE));
      while (tiles.length < count) {
        const canvas = document.createElement('canvas');
        canvas.className = 'backdrop-tile';
        canvas.style.top = `${tiles.length * TILE}px`;
        layer.appendChild(canvas);
        const tile = { canvas, off: null, index: tiles.length, dirty: true, visible: false, fresh: true, placed: null };
        tiles.push(tile);
        observer.observe(canvas);
      }
      while (tiles.length > count) {
        const tile = tiles.pop();
        cancelTileAnimations(tile);
        observer.unobserve(tile.canvas);
        tile.canvas.remove();
      }
    };

    // Re-measure real content and mark every tile for a refill
    const refresh = () => {
      version += 1;
      busy = false;
      cancelIdle(handle);
      const myVersion = version;
      syncTiles();
      tiles.forEach((t) => {
        t.dirty = true;
      });
      Object.assign(faces, readFaces());
      // Canvas metrics need the faces loaded; cached fonts resolve immediately
      const loads = [`900 40px ${faces.display}`, `700 40px ${faces.display}`, `italic 400 20px ${faces.serif}`, `700 20px ${faces.mono}`].map((f) =>
        document.fonts.load(f).catch(() => null)
      );
      Promise.all(loads).then(() => {
        if (myVersion !== version) return;
        const origin = layer.getBoundingClientRect();
        runSliced(collectBlocked(host, origin), myVersion, (rects) => {
          blocked = rects;
          fillNextTile();
        });
      });
    };

    // Navigation: the old edition wipes out with the old page...
    const onPageExit = () => {
      version += 1; // stop any fill in progress for the old page
      clearTimeout(debounce);
      wipeOutAll();
    };
    // ...and at the swap a new edition is generated and wipes in once measured
    const onPageChange = () => {
      clearTimeout(debounce);
      edition = newSeed();
      tiles.forEach((t) => {
        cancelTileAnimations(t);
        visibleCtx(t)?.clearRect(0, 0, t.canvas.width, t.canvas.height);
        t.fresh = true;
      });
      refresh();
    };
    window.addEventListener('pageexit', onPageExit);
    window.addEventListener('pagechange', onPageChange);

    const scheduleRefresh = () => {
      clearTimeout(debounce);
      debounce = setTimeout(refresh, 250);
    };

    // Content changes anywhere in the layout (loaded data, typing) and size changes. Ignores the
    // layer itself and the word-wipe clones, which only overlay existing content.
    const isClone = (node) => node.nodeType === 1 && node.hasAttribute('data-wipe-clone');
    const irrelevant = (r) =>
      r.target === layer ||
      layer.contains(r.target) ||
      (r.type === 'childList' && [...r.addedNodes, ...r.removedNodes].every(isClone));
    const mutations = new MutationObserver((records) => {
      if (records.every(irrelevant)) return;
      scheduleRefresh();
    });
    mutations.observe(host, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'open'] });
    const resize = new ResizeObserver(scheduleRefresh);
    resize.observe(host);

    // ---- Ambient: a few on-screen words swap for new ones every few seconds ----
    const ambient = reduced
      ? null
      : setInterval(() => {
          if (document.visibilityState !== 'visible') return;
          const color = ink();
          tiles
            .filter((t) => t.placed && !t.dirty && !t.fresh && (t.visible || nearViewport(t)))
            .forEach((tile) => {
              const count = Math.max(1, Math.round(tile.placed.length * AMBIENT_SHARE));
              for (let i = 0; i < count; i += 1) {
                const index = Math.floor(random() * tile.placed.length);
                const old = tile.placed[index];
                if (old.swapping) continue;
                const next = pickReplacement(old, vocabulary, measureText, random);
                if (!next) continue;
                old.swapping = true;
                const delay = random() * (AMBIENT_EVERY_MS - SWAP_OUT_MS - SWAP_IN_MS);
                animate(tile, old, 'out', SWAP_OUT_MS, delay, () => {
                  if (tile.placed?.[index] !== old) return; // tile was refilled meanwhile
                  const offCtx = tile.off?.getContext('2d');
                  if (!offCtx) return;
                  offCtx.clearRect(old.x - 1, old.y - 1, old.w + 2, old.h + 2);
                  drawFill(offCtx, [next], color);
                  tile.placed[index] = next;
                  animate(tile, next, 'in', SWAP_IN_MS);
                });
              }
            });
        }, AMBIENT_EVERY_MS);

    document.fonts.ready.then(refresh);

    return () => {
      version += 1;
      clearTimeout(debounce);
      clearInterval(ambient);
      cancelIdle(handle);
      if (frame) cancelAnimationFrame(frame);
      animations.clear();
      window.removeEventListener('pageexit', onPageExit);
      window.removeEventListener('pagechange', onPageChange);
      observer.disconnect();
      mutations.disconnect();
      resize.disconnect();
      tiles.forEach((t) => t.canvas.remove());
    };
  }, [articles, isDarkMode]);

  return <div ref={layerRef} className="backdrop-layer" aria-hidden="true" />;
};

export default NewspaperBackdrop;
