import { afterEach, describe, expect, it } from 'vitest';
import { buildVocabulary, collectBlocked, isTransparent, TEXT_PAD, BOX_PAD } from '../../src/utils/backdropDom.js';
import { processArticleList } from '../../src/utils/richTextConverter.js';
import { rawArticles } from '../fixtures/articles.js';

const run = (gen) => {
  let r = gen.next();
  while (!r.done) r = gen.next();
  return r.value;
};

const rect = (left, top, width, height) => ({ left, top, right: left + width, bottom: top + height, width, height });

afterEach(() => {
  document.body.innerHTML = '';
});

describe('buildVocabulary', () => {
  it('uses title words, topic names and the masthead, each with a font', () => {
    const vocab = buildVocabulary(processArticleList(rawArticles));
    const texts = vocab.map((w) => w.text);
    expect(texts).toContain('THEPK.IN');
    expect(texts).toContain('OpenAI');
    expect(texts).toContain('Anthropic');
    expect(new Set(texts).size).toBe(texts.length);
    for (const w of vocab) {
      expect(w.text.length).toBeGreaterThanOrEqual(3);
      expect(w.font(20)).toMatch(/20px/);
    }
  });
});

describe('isTransparent', () => {
  it('recognises transparent colours', () => {
    expect(isTransparent('transparent')).toBe(true);
    expect(isTransparent('rgba(0, 0, 0, 0)')).toBe(true);
    expect(isTransparent('rgb(250, 250, 248)')).toBe(false);
    expect(isTransparent('rgba(0, 0, 0, 0.5)')).toBe(false);
  });
});

describe('collectBlocked', () => {
  it('blocks text line boxes, controls, borders and filled backgrounds, relative to the origin', () => {
    document.body.innerHTML = `
      <div id="root">
        <p id="para">Hello</p>
        <button id="btn">Go</button>
        <div id="ruled" style="border-top: 3px solid black"></div>
        <div id="filled" style="background-color: rgb(240, 240, 240)"></div>
        <div class="backdrop-layer"><span>ignored</span></div>
      </div>`;
    const root = document.getElementById('root');
    // jsdom has no layout engine: give elements and text ranges fixed boxes
    const boxes = {
      btn: rect(100, 200, 50, 20),
      ruled: rect(0, 300, 400, 40),
      filled: rect(0, 400, 200, 100),
    };
    for (const el of root.querySelectorAll('*')) el.getBoundingClientRect = () => boxes[el.id] || rect(0, 0, 0, 0);
    const originalRange = document.createRange;
    document.createRange = () => {
      const range = originalRange.call(document);
      let node = null;
      range.selectNodeContents = (n) => {
        node = n;
      };
      range.getClientRects = () => (node?.parentElement?.id === 'para' ? [rect(10, 20, 60, 16)] : []);
      return range;
    };

    const rects = run(collectBlocked(root, { left: 10, top: 20 }));
    document.createRange = originalRange;

    // Text box, shifted by the origin and padded
    expect(rects).toContainEqual({ left: -TEXT_PAD, top: -TEXT_PAD, right: 60 + TEXT_PAD, bottom: 16 + TEXT_PAD });
    // Button as a solid control
    expect(rects).toContainEqual({ left: 90 - BOX_PAD, top: 180 - BOX_PAD, right: 140 + BOX_PAD, bottom: 200 + BOX_PAD });
    // Only the 3px top border of the ruled box, not the whole box
    expect(rects).toContainEqual({ left: -10 - BOX_PAD, top: 280 - BOX_PAD, right: 390 + BOX_PAD, bottom: 283 + BOX_PAD });
    // Filled background blocks its whole box
    expect(rects).toContainEqual({ left: -10 - BOX_PAD, top: 380 - BOX_PAD, right: 190 + BOX_PAD, bottom: 480 + BOX_PAD });
    // Nothing from inside the backdrop layer itself
    expect(rects).toHaveLength(4);
  });

  it('ignores hidden content (closed <details>) and transparent borders', () => {
    document.body.innerHTML = `
      <div id="root">
        <details><summary>Browse</summary><a id="hidden" style="border-bottom: 1px solid black">Hidden link</a></details>
        <a id="clear" style="border-bottom: 1px solid transparent">Clear border</a>
      </div>`;
    const root = document.getElementById('root');
    for (const el of root.querySelectorAll('*')) {
      el.getBoundingClientRect = () => rect(0, 0, 100, 20);
      // What the browser reports for content inside a closed <details>
      el.checkVisibility = () => el.id !== 'hidden';
    }
    const rects = run(collectBlocked(root, { left: 0, top: 0 }));
    // Only the summary and the visible link's text could block; neither has a visible border
    for (const r of rects) expect(r.bottom - r.top).toBeGreaterThan(1 + BOX_PAD * 2);
  });

  it('yields while walking long pages', () => {
    document.body.innerHTML = `<div id="root">${'<p>word</p>'.repeat(400)}</div>`;
    const gen = collectBlocked(document.getElementById('root'), { left: 0, top: 0 });
    let yields = 0;
    let r = gen.next();
    while (!r.done) {
      yields += 1;
      r = gen.next();
    }
    expect(yields).toBeGreaterThan(1);
  });
});
