// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { renderPage } from '../../server/render.js';
import { processArticleList } from '../../src/utils/richTextConverter.js';
import { ZONES } from '../../src/seo/flightline.js';
import { rawArticles } from '../fixtures/articles.js';

const articles = processArticleList(rawArticles);
const page = (path) => renderPage({ path, searchParams: new URLSearchParams(), articles });
const jsonLd = (head) =>
  [...head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

describe('flightline page (server)', () => {
  it('has VideoGame structured data, a share image and crawlable content', () => {
    const p = page('/flightline');
    expect(p.status).toBe(200);
    expect(p.head).toContain('<title>Flightline: Endless Flight Game for Android | Pradhyuman Yadav</title>');
    const game = jsonLd(p.head)[0]['@graph'].find((g) => Array.isArray(g['@type']) && g['@type'].includes('VideoGame'));
    expect(game).toMatchObject({ name: 'Flightline', gamePlatform: 'Android', softwareVersion: '1.0.0' });
    expect(game.downloadUrl).toBeUndefined();
    expect(p.head).toContain('<meta property="og:image" content="https://thepk.in/flightline/feature-1024x500.png" />');
    expect(p.head).toContain('<meta name="twitter:card" content="summary_large_image" />');
    for (const z of ZONES) expect(p.body).toContain(z.name);
    expect(p.body).toContain('href="/privacy#flightline"');
  });

  it('leaves other pages with the plain card and no image', () => {
    const home = page('/');
    expect(home.head).not.toContain('og:image');
    expect(home.head).toContain('<meta name="twitter:card" content="summary" />');
  });
});
