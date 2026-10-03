import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { splitWords, wipeElement, watchForNewContent, DIRECTIONS, WIPE_MS } from '../../src/utils/wordWipe.js';

const html = (markup) => {
  const div = document.createElement('div');
  div.innerHTML = markup;
  document.body.appendChild(div);
  return div;
};

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('splitWords', () => {
  it('wraps each word in a span with one of the four wipe directions and keeps spacing', () => {
    const root = html('<p>Daily AI <b>news briefs</b></p>');
    splitWords(root);
    const words = [...root.querySelectorAll('.wipe-word')];
    expect(words.map((w) => w.textContent)).toEqual(['Daily', 'AI', 'news', 'briefs']);
    for (const w of words) expect(DIRECTIONS).toContain(w.style.getPropertyValue('--wipe-edge'));
    expect(root.textContent).toBe('Daily AI news briefs');
  });

  it('leaves form fields, scripts and opted-out subtrees alone', () => {
    const root = html('<textarea>keep me</textarea><div data-no-wipe>skip this</div><select><option>opt</option></select><span>split</span>');
    splitWords(root);
    expect([...root.querySelectorAll('.wipe-word')].map((w) => w.textContent)).toEqual(['split']);
  });

  it('only splits text nodes flagged as visible', () => {
    const root = html('<p>first</p><p>second</p>');
    splitWords(root, [false, true]);
    expect([...root.querySelectorAll('.wipe-word')].map((w) => w.textContent)).toEqual(['second']);
  });
});

describe('wipeElement', () => {
  beforeEach(() => {
    // jsdom has no layout; pretend elements are rendered
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', { configurable: true, get: () => document.body });
  });
  afterEach(() => {
    delete HTMLElement.prototype.offsetParent;
  });

  it('lays a word-split clone over the element, then removes it and restores the element', async () => {
    vi.useFakeTimers();
    const el = html('<h1 id="t">Hello world</h1>').firstElementChild;
    const done = wipeElement(el, 'in');
    const clone = el.nextElementSibling;
    expect(clone).not.toBeNull();
    expect(clone.hasAttribute('data-wipe-clone')).toBe(true);
    expect(clone.getAttribute('aria-hidden')).toBe('true');
    expect(clone.classList.contains('wipe-in')).toBe(true);
    expect(clone.id).toBe('');
    expect(clone.querySelectorAll('.wipe-word')).toHaveLength(2);
    expect(el.style.visibility).toBe('hidden');
    // The live element itself is never split
    expect(el.querySelectorAll('.wipe-word')).toHaveLength(0);

    vi.advanceTimersByTime(WIPE_MS + 50);
    await done;
    expect(el.nextElementSibling).toBeNull();
    expect(el.style.visibility).toBe('');
  });

  it('keeps the element hidden after a wipe-out (it is about to be replaced)', async () => {
    vi.useFakeTimers();
    const el = html('<p>Bye</p>').firstElementChild;
    const done = wipeElement(el, 'out');
    expect(el.nextElementSibling.classList.contains('wipe-out')).toBe(true);
    vi.advanceTimersByTime(WIPE_MS + 50);
    await done;
    expect(el.style.visibility).toBe('hidden');
  });

  it('does nothing when the visitor prefers reduced motion', async () => {
    const original = window.matchMedia;
    window.matchMedia = (q) => ({ ...original(q), matches: q.includes('reduce') });
    const el = html('<p>Still</p>').firstElementChild;
    await wipeElement(el, 'in');
    expect(el.nextElementSibling).toBeNull();
    expect(el.style.visibility).toBe('');
    window.matchMedia = original;
  });

  it('replaces iframes in the clone so embeds do not reload', () => {
    const el = html('<div><iframe src="about:blank"></iframe><p>text</p></div>').firstElementChild;
    wipeElement(el, 'in');
    expect(el.nextElementSibling.querySelector('iframe')).toBeNull();
    expect(el.querySelector('iframe')).not.toBeNull();
  });
});

describe('watchForNewContent', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', { configurable: true, get: () => document.body });
  });
  afterEach(() => {
    delete HTMLElement.prototype.offsetParent;
  });

  const flush = () => new Promise((r) => setTimeout(r, 0));

  it('wipes in elements added later, but not while the visitor is typing', async () => {
    const root = html('<ul></ul>');
    const list = root.firstElementChild;
    const stop = watchForNewContent(root);

    const li = document.createElement('li');
    li.textContent = 'new item';
    list.appendChild(li);
    await flush();
    expect(li.nextElementSibling?.hasAttribute('data-wipe-clone')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    const typed = document.createElement('li');
    typed.textContent = 'typed result';
    list.appendChild(typed);
    await flush();
    expect(typed.nextElementSibling).toBeNull();
    stop();
  });
});
