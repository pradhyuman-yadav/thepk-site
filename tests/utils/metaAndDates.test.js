// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { formatArticleDate } from '../../src/utils/dates.js';
import {
  STATIC_ROUTES,
  NAV_LINKS,
  pageTitle,
  canonicalUrl,
  clampDescription,
  DEFAULT_TITLE,
} from '../../src/seo/siteMeta.js';

describe('formatArticleDate', () => {
  it('formats in US Pacific time so late-evening posts keep their local date', () => {
    expect(formatArticleDate('2026-09-22T06:03:29Z')).toBe('September 21, 2026');
    expect(formatArticleDate('2026-09-22T12:00:00Z')).toBe('September 22, 2026');
    expect(formatArticleDate(null)).toBe('');
  });
});

describe('siteMeta', () => {
  it('builds titles and canonical URLs', () => {
    expect(pageTitle('')).toBe(DEFAULT_TITLE);
    expect(pageTitle('Tools')).toBe('Tools | Pradhyuman Yadav');
    expect(canonicalUrl('/')).toBe('https://thepk.in/');
    expect(canonicalUrl('/articles', '?topic=openai')).toBe('https://thepk.in/articles?topic=openai');
  });

  it('clamps descriptions to 160 characters on a word boundary', () => {
    const long = 'word '.repeat(80);
    const clamped = clampDescription(long);
    expect(clamped.length).toBeLessThanOrEqual(160);
    expect(clamped.endsWith('...')).toBe(true);
    expect(clamped).not.toMatch(/wor\.\.\.$/);
    expect(clampDescription('short')).toBe('short');
  });

  it('keeps every static title under 66 characters and description under 161', () => {
    for (const [path, route] of Object.entries(STATIC_ROUTES)) {
      expect(pageTitle(route.title).length, path).toBeLessThanOrEqual(65);
      expect(route.description.length, path).toBeLessThanOrEqual(160);
      expect(route.description, path).not.toMatch(/[–—]/);
    }
  });

  it('has SEO metadata for every route in App.jsx, and every nav link is a route', () => {
    const app = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
    const paths = [...app.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]).filter((p) => p !== '*' && !p.includes(':'));
    expect(paths.length).toBeGreaterThan(10);
    for (const p of paths) expect(STATIC_ROUTES[p], p).toBeDefined();
    for (const link of NAV_LINKS) expect(paths).toContain(link.path);
  });

  it('keeps the public nav labels unchanged', () => {
    expect(NAV_LINKS.map((l) => l.label)).toEqual(['Home', 'Articles', 'Tools', 'About Me', 'AI Chat (SLM)', 'Pipeline', 'DC Metro']);
  });
});
