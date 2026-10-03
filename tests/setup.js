// Browser APIs jsdom does not provide. Only applied in the jsdom environment.
import { afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

if (typeof window !== 'undefined') {
  const { cleanup } = await import('@testing-library/react');
  afterEach(() => {
    cleanup();
    localStorage.clear();
    delete window.__INITIAL_ARTICLES__;
  });

  window.matchMedia ??= (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  });

  class NoopObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  window.IntersectionObserver ??= NoopObserver;
  window.ResizeObserver ??= NoopObserver;
  window.scrollTo = () => {};

  if (!document.fonts) {
    Object.defineProperty(document, 'fonts', { value: { ready: Promise.resolve(), load: () => Promise.resolve([]) } });
  }

  // jsdom has no canvas backend; returning null makes canvas code take its no-context path quietly
  HTMLCanvasElement.prototype.getContext = () => null;
}
