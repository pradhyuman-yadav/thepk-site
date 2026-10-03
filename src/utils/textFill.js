/**
 * Word-wrap fill: packs words into every free space of a region, like text wrapping around
 * obstacles. Words are axis-aligned at 0, 90, 180 or 270 degrees, sizes vary, and no two words
 * (or a word and a blocked area) ever overlap. Pure logic on an occupancy grid; no DOM.
 *
 * The region is scanned row by row, left to right. At each free cell a word is tried at a random
 * size and orientation, then at smaller sizes until one fits, so large words claim open areas
 * while small words close the gaps.
 */

export const ORIENTATIONS = [0, 90, 180, 270];

// Mostly reading direction, often vertical, sometimes upside down
const ORIENTATION_WEIGHTS = [
  [0, 0.5],
  [90, 0.2],
  [270, 0.2],
  [180, 0.1],
];

export const DEFAULT_SIZES = [8, 9, 10, 12, 14, 16, 19, 23, 28, 34, 42, 52, 64, 80];

/** Small deterministic PRNG so the same region and seed always produce the same fill. */
export const mulberry32 = (seed) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const pickOrientation = (random) => {
  let r = random();
  for (const [deg, weight] of ORIENTATION_WEIGHTS) {
    if (r < weight) return deg;
    r -= weight;
  }
  return 0;
};

/**
 * @param {Object} options
 * @param {number} options.width - region width in px
 * @param {number} options.height - region height in px
 * @param {Array<{left:number,top:number,right:number,bottom:number}>} options.blocked - areas to keep clear
 * @param {Array<{text:string, font:(size:number)=>string}>} options.words - vocabulary
 * @param {(text:string, font:string) => {w:number, ascent:number, descent:number}} options.measure - text metrics
 * @param {() => number} options.random - PRNG
 * @param {number[]} [options.sizes] - font sizes, ascending
 * @param {number} [options.cell] - grid resolution in px (also the minimum gap between words)
 * @param {number} [options.gapCells] - extra empty cells kept after each word
 * @param {number} [options.yieldEvery] - attempts between yields
 * @returns {Generator<undefined, Array<{text, font, size, rotation, x, y, w, h, ascent, descent}>>}
 */
export function* fillSteps({
  width,
  height,
  blocked = [],
  words,
  measure,
  random,
  sizes = DEFAULT_SIZES,
  cell = 2,
  gapCells = 1,
  yieldEvery = 600,
}) {
  const placed = [];
  const cols = Math.floor(width / cell);
  const rows = Math.floor(height / cell);
  if (cols <= 0 || rows <= 0 || !words.length) return placed;

  const occupied = new Uint8Array(cols * rows);
  for (const r of blocked) {
    const x0 = Math.max(0, Math.floor(r.left / cell));
    const x1 = Math.min(cols, Math.ceil(r.right / cell));
    const y0 = Math.max(0, Math.floor(r.top / cell));
    const y1 = Math.min(rows, Math.ceil(r.bottom / cell));
    for (let y = y0; y < y1; y += 1) occupied.fill(1, y * cols + x0, Math.max(y * cols + x0, y * cols + x1));
  }

  const isFree = (x, y, w, h) => {
    for (let row = y; row < y + h; row += 1) {
      const base = row * cols;
      for (let col = x; col < x + w; col += 1) if (occupied[base + col]) return false;
    }
    return true;
  };

  const metricsCache = new Map();
  const metricsFor = (text, font) => {
    const key = `${font}|${text}`;
    if (!metricsCache.has(key)) metricsCache.set(key, measure(text, font));
    return metricsCache.get(key);
  };

  let attempts = 0;
  for (let y = 0; y < rows; y += 1) {
    let x = 0;
    while (x < cols) {
      if (occupied[y * cols + x]) {
        x += 1;
        continue;
      }
      attempts += 1;
      if (attempts % yieldEvery === 0) yield;

      const word = words[Math.floor(random() * words.length)];
      const rotation = pickOrientation(random);
      // Biased toward small sizes so gaps fill densely; large type appears where there is room
      const start = Math.floor(random() ** 2.4 * sizes.length);
      let done = false;
      for (let s = start; s >= 0 && !done; s -= 1) {
        const size = sizes[s];
        const font = word.font(size);
        const m = metricsFor(word.text, font);
        const textW = Math.ceil(m.w);
        const textH = Math.ceil(m.ascent + m.descent);
        if (!textW || !textH) continue;
        const vertical = rotation === 90 || rotation === 270;
        const boxW = vertical ? textH : textW;
        const boxH = vertical ? textW : textH;
        const w = Math.ceil(boxW / cell) + gapCells;
        const h = Math.ceil(boxH / cell) + gapCells;
        if (x + w - gapCells > cols || y + h - gapCells > rows) continue;
        const fitW = Math.min(w, cols - x);
        const fitH = Math.min(h, rows - y);
        if (!isFree(x, y, fitW, fitH)) continue;
        for (let row = y; row < y + fitH; row += 1) occupied.fill(1, row * cols + x, row * cols + x + fitW);
        placed.push({
          text: word.text,
          font,
          size,
          rotation,
          x: x * cell,
          y: y * cell,
          w: boxW,
          h: boxH,
          ascent: m.ascent,
          descent: m.descent,
        });
        x += w;
        done = true;
      }
      if (!done) x += 1;
    }
  }
  return placed;
}

/** Run fillSteps to completion (tests and small regions). */
export const fillRegion = (options) => {
  const steps = fillSteps(options);
  let result = steps.next();
  while (!result.done) result = steps.next();
  return result.value;
};

/**
 * Draw placements onto a 2D context. Each word is centred in its box and rotated in place.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} placed - output of fillSteps
 * @param {string} ink - fill colour
 * @param {number} [offsetY] - vertical offset (tiles draw a slice of a taller region)
 */
export const drawFill = (ctx, placed, ink, offsetY = 0) => {
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (const p of placed) {
    ctx.save();
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2 + offsetY);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.font = p.font;
    ctx.fillText(p.text, 0, (p.ascent - p.descent) / 2);
    ctx.restore();
  }
};
