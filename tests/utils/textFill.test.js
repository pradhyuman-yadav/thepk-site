// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { fillRegion, fillSteps, mulberry32, ORIENTATIONS, drawFill } from '../../src/utils/textFill.js';

const words = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'OpenAI', 'Anthropic', 'chips', 'model'].map((text) => ({
  text,
  font: (size) => `700 ${size}px Test`,
}));
// Deterministic fake metrics: width proportional to length, cap height proportional to size
const measure = (text, font) => {
  const size = parseFloat(font.match(/(\d+(?:\.\d+)?)px/)[1]);
  return { w: text.length * size * 0.55, ascent: size * 0.72, descent: size * 0.2 };
};

const run = (overrides = {}) =>
  fillRegion({ width: 800, height: 600, words, measure, random: mulberry32(42), ...overrides });

const intersects = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const area = (r) => (r.right - r.left) * (r.bottom - r.top);

describe('fillRegion', () => {
  it('places words only at 0, 90, 180 or 270 degrees', () => {
    const placed = run();
    expect(placed.length).toBeGreaterThan(50);
    for (const p of placed) expect(ORIENTATIONS).toContain(p.rotation);
    // All four orientations actually occur
    expect(new Set(placed.map((p) => p.rotation)).size).toBe(4);
  });

  // Pairwise checks collect violations and assert once (thousands of words make per-pair expects slow)
  const overlapsAmong = (boxes, others = boxes) => {
    const bad = [];
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = 0; j < others.length; j += 1) {
        if ((others === boxes ? j > i : j !== i) && intersects(boxes[i], others[j])) bad.push(`${boxes[i].text}/${others[j].text}`);
      }
    }
    return bad;
  };

  it('never overlaps two words', () => {
    const placed = run();
    expect(placed.length).toBeGreaterThan(50);
    expect(overlapsAmong(placed)).toEqual([]);
  });

  it('keeps at least one grid cell between words', () => {
    const cell = 2;
    const placed = run({ cell });
    const grown = placed.map((p) => ({ ...p, w: p.w + cell - 0.01, h: p.h + cell - 0.01 }));
    expect(overlapsAmong(grown, placed)).toEqual([]);
  });

  it('stays inside the region', () => {
    const placed = run();
    for (const p of placed) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.x + p.w).toBeLessThanOrEqual(800);
      expect(p.y + p.h).toBeLessThanOrEqual(600);
    }
  });

  it('never enters a blocked area', () => {
    const blocked = [
      { left: 100, top: 50, right: 500, bottom: 200 },
      { left: 600, top: 0, right: 620, bottom: 600 },
    ];
    const placed = run({ blocked });
    for (const p of placed) {
      for (const b of blocked) {
        const box = { x: b.left, y: b.top, w: b.right - b.left, h: b.bottom - b.top };
        expect(intersects(p, box), `${p.text} at ${p.x},${p.y}`).toBe(false);
      }
    }
  });

  it('fills most of the free space, like wrapped text', () => {
    const blocked = [{ left: 200, top: 100, right: 600, bottom: 500 }];
    const placed = run({ blocked });
    const free = 800 * 600 - area(blocked[0]);
    const covered = placed.reduce((sum, p) => sum + p.w * p.h, 0);
    expect(covered / free).toBeGreaterThan(0.4);
  });

  it('uses a range of sizes', () => {
    const sizes = new Set(run().map((p) => p.size));
    expect(sizes.size).toBeGreaterThan(4);
  });

  it('is deterministic for the same seed and differs for another seed', () => {
    const a = run();
    const b = run();
    const c = run({ random: mulberry32(7) });
    expect(b).toEqual(a);
    expect(c).not.toEqual(a);
  });

  it('returns nothing for empty input or a fully blocked region', () => {
    expect(run({ words: [] })).toEqual([]);
    expect(run({ width: 0 })).toEqual([]);
    expect(run({ blocked: [{ left: 0, top: 0, right: 800, bottom: 600 }] })).toEqual([]);
  });

  it('yields during long runs so callers can slice the work', () => {
    const steps = fillSteps({ width: 800, height: 600, words, measure, random: mulberry32(1), yieldEvery: 50 });
    let yields = 0;
    let r = steps.next();
    while (!r.done) {
      yields += 1;
      r = steps.next();
    }
    expect(yields).toBeGreaterThan(1);
    expect(r.value.length).toBeGreaterThan(0);
  });
});

describe('drawFill', () => {
  it('rotates each word around its own box centre', () => {
    const calls = [];
    const ctx = new Proxy(
      {},
      {
        get: (_, name) => (name in ctx_props ? ctx_props[name] : (...args) => calls.push([name, ...args])),
        set: (_, name, value) => {
          calls.push([`set:${name}`, value]);
          return true;
        },
      }
    );
    const ctx_props = {};
    drawFill(ctx, [{ text: 'hi', font: '10px X', rotation: 90, x: 10, y: 20, w: 8, h: 30, ascent: 7, descent: 2 }], '#111');
    expect(calls).toContainEqual(['translate', 14, 35]);
    expect(calls).toContainEqual(['rotate', Math.PI / 2]);
    expect(calls).toContainEqual(['fillText', 'hi', 0, 2.5]);
    expect(calls).toContainEqual(['set:fillStyle', '#111']);
  });
});
