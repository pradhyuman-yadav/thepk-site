import { useEffect, useRef } from 'react';
import { useArticles } from '../hooks/useArticles';
import { useTheme } from '../contexts/theme';
import { fillSteps, drawFill, mulberry32 } from '../utils/textFill';
import { buildVocabulary, collectBlocked, measureText } from '../utils/backdropDom';

/**
 * Background type that fills every empty space of the page, word-wrap style: around and between
 * headings, paragraphs, links, the section links and the nameplate. Words are set at 0/90/180/270
 * degrees with a 2px gap and never touch real content.
 *
 * The layer covers the whole layout (it scrolls with the page) and is split into canvas tiles that
 * are filled only when they come near the viewport. Real content is measured from the DOM (text
 * line boxes, media, controls, borders and filled backgrounds; see utils/backdropDom.js) and kept
 * clear. Any content change (navigation, loaded data, typing, resize, theme) re-measures and
 * refills. Decorative only: aria-hidden, no pointer events, washed out with CSS opacity.
 */

const TILE = 1024;

const idle = (fn) =>
  typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(fn, { timeout: 800 }) : setTimeout(fn, 16);
const cancelIdle = (h) =>
  typeof window.cancelIdleCallback === 'function' ? window.cancelIdleCallback(h) : clearTimeout(h);

const NewspaperBackdrop = () => {
  const layerRef = useRef(null);
  const { articles } = useArticles();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const layer = layerRef.current;
    const host = layer?.parentElement;
    if (!layer || !host || !articles.length) return undefined;

    const vocabulary = buildVocabulary(articles);
    const tiles = []; // { canvas, index, dirty, visible }
    let blocked = null;
    let version = 0;
    let handle = null;
    let debounce = null;
    let busy = false;

    const ink = () => getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#1A1A1A';

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
    const nearViewport = (tile) => {
      const r = tile.canvas.getBoundingClientRect();
      const top = layer.getBoundingClientRect().top + tile.index * TILE;
      return top < window.innerHeight + 600 && top + Math.max(r.height, TILE) > -600;
    };

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
        random: mulberry32(tile.index * 2654435761 + width),
      });
      runSliced(steps, myVersion, (placed) => {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const canvas = tile.canvas;
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        canvas.style.height = `${height}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
          ctx.clearRect(0, 0, width, height);
          drawFill(ctx, placed, ink());
        }
        canvas.classList.add('is-drawn');
        tile.dirty = false;
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
        const tile = { canvas, index: tiles.length, dirty: true, visible: false };
        tiles.push(tile);
        observer.observe(canvas);
      }
      while (tiles.length > count) {
        const tile = tiles.pop();
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
      const origin = layer.getBoundingClientRect();
      runSliced(collectBlocked(host, origin), myVersion, (rects) => {
        blocked = rects;
        fillNextTile();
      });
    };

    // On navigation the old page's filler must not sit under the new page: clear it and refill now
    const onPageChange = () => {
      clearTimeout(debounce);
      tiles.forEach((t) => t.canvas.classList.remove('is-drawn'));
      refresh();
    };
    window.addEventListener('pagechange', onPageChange);

    const scheduleRefresh = () => {
      clearTimeout(debounce);
      debounce = setTimeout(refresh, 250);
    };

    // Content changes anywhere in the layout (navigation, loaded data, typing) and size changes
    // Ignores the layer itself and the word-wipe clones, which only overlay existing content
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

    document.fonts.ready.then(refresh);

    return () => {
      version += 1;
      clearTimeout(debounce);
      cancelIdle(handle);
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
