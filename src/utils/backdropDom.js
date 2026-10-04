/**
 * DOM side of the background fill: text measurement, the word vocabulary, and the rectangles of
 * real content that the fill must keep clear. The packing itself lives in textFill.js.
 */
import { countCategories } from './categorize';

const DISPLAY = "'Playfair Display', 'Times New Roman', serif";
const SERIF = "'Times New Roman', Georgia, serif";
const MONO = "'Courier New', monospace";

export const TEXT_PAD = 4; // clearance around real text
export const BOX_PAD = 2; // clearance around controls, rules and filled boxes
// Elements kept clear as whole boxes; [data-backdrop-block] lets components reserve an area (e.g. an animated lane)
const SOLID = 'img, svg, canvas, video, iframe, input, textarea, select, button, hr, progress, meter, [data-backdrop-block]';
const SKIP = '.backdrop-layer, [data-wipe-clone], script, style';

let measureCtx = null;
const REF = 100;
const refCache = new Map();

/**
 * Text metrics for a CSS font string. Glyph metrics scale linearly with size, so each word and
 * face is measured once at 100px and scaled.
 */
export const measureText = (text, font) => {
  const sizeMatch = font.match(/(\d+(?:\.\d+)?)px/);
  const size = sizeMatch ? Number(sizeMatch[1]) : REF;
  const refFont = font.replace(/(\d+(?:\.\d+)?)px/, `${REF}px`);
  const key = `${refFont}|${text}`;
  if (!refCache.has(key)) {
    measureCtx ??= document.createElement('canvas').getContext('2d');
    if (!measureCtx) return { w: 0, ascent: 0, descent: 0 };
    measureCtx.font = refFont;
    const m = measureCtx.measureText(text);
    refCache.set(key, { w: m.width, ascent: m.actualBoundingBoxAscent, descent: m.actualBoundingBoxDescent });
  }
  const r = refCache.get(key);
  const k = size / REF;
  return { w: r.w * k, ascent: r.ascent * k, descent: r.descent * k };
};

/** Vocabulary from the current edition: title words, topic names and the masthead. */
export const buildVocabulary = (articles) => {
  const words = new Set(['THEPK.IN', 'Daily', 'News']);
  countCategories(articles).forEach((c) => words.add(c.label));
  articles.slice(0, 60).forEach((a) =>
    a.title.split(/\s+/).forEach((w) => {
      const clean = w.replace(/[^\p{L}\p{N}'.&-]/gu, '').replace(/^[.'&-]+|[.'&-]+$/g, '');
      if (clean.length >= 3) words.add(clean);
    })
  );
  // Each word keeps one face: display serif for most, italic body serif and mono for texture
  return [...words].map((text, i) => {
    const face = i % 7 === 0 ? 'mono' : i % 3 === 0 ? 'serif' : 'display';
    const font = (size) =>
      face === 'mono'
        ? `700 ${size}px ${MONO}`
        : face === 'serif'
          ? `italic 400 ${size}px ${SERIF}`
          : `${size >= 20 ? 900 : 700} ${size}px ${DISPLAY}`;
    return { text, font };
  });
};

// Hidden content (closed <details>, display:none, content-visibility) still reports boxes in some
// browsers; only rendered content should block the fill
const isRendered = (el) => (typeof el.checkVisibility === 'function' ? el.checkVisibility({ contentVisibilityAuto: true }) : true);

export const isTransparent = (color) =>
  !color || color === 'transparent' || /^rgba\([^)]*,\s*0(\.0+)?\)$/.test(color);

/**
 * Rectangles, relative to `origin`, that the fill must keep clear: text line boxes, media and
 * controls, borders, and filled backgrounds. A generator that yields between batches so long
 * pages never block the main thread; its return value is the rectangle list.
 * @param {Element} root
 * @param {{left:number, top:number}} origin
 */
export function* collectBlocked(root, origin) {
  const out = [];
  const pushRect = (r, pad) => {
    if (!(r.right - r.left > 0) || !(r.bottom - r.top > 0)) return;
    out.push({
      left: r.left - origin.left - pad,
      top: r.top - origin.top - pad,
      right: r.right - origin.left + pad,
      bottom: r.bottom - origin.top + pad,
    });
  };

  // Text: the actual line boxes, so filler can sit right next to short lines
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.nodeValue.trim() && !node.parentElement?.closest(SKIP) && isRendered(node.parentElement)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
  });
  const range = document.createRange();
  let count = 0;
  while (walker.nextNode()) {
    range.selectNodeContents(walker.currentNode);
    for (const r of range.getClientRects?.() || []) pushRect(r, TEXT_PAD);
    count += 1;
    if (count % 150 === 0) yield;
  }

  // Media, controls, borders and filled backgrounds
  const elements = root.querySelectorAll('*');
  for (let i = 0; i < elements.length; i += 1) {
    if (i % 150 === 149) yield;
    const el = elements[i];
    if (el.closest(SKIP) || !isRendered(el)) continue;
    if (el.matches(SOLID)) {
      pushRect(el.getBoundingClientRect(), BOX_PAD);
      continue;
    }
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.display === 'contents') continue;
    const r = el.getBoundingClientRect();
    if (!isTransparent(cs.backgroundColor)) {
      pushRect(r, BOX_PAD);
      continue;
    }
    const edges = [
      ['Top', (w) => ({ left: r.left, right: r.right, top: r.top, bottom: r.top + w })],
      ['Bottom', (w) => ({ left: r.left, right: r.right, top: r.bottom - w, bottom: r.bottom })],
      ['Left', (w) => ({ left: r.left, right: r.left + w, top: r.top, bottom: r.bottom })],
      ['Right', (w) => ({ left: r.right - w, right: r.right, top: r.top, bottom: r.bottom })],
    ];
    for (const [side, rectFor] of edges) {
      const width = parseFloat(cs[`border${side}Width`]) || 0;
      if (width > 0 && cs[`border${side}Style`] !== 'none' && !isTransparent(cs[`border${side}Color`])) pushRect(rectFor(width), BOX_PAD);
    }
  }
  return out;
}
