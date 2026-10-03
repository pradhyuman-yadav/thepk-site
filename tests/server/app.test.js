// @vitest-environment node
import http from 'node:http';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp, createArticleCache } from '../../server/app.js';
import { processArticleList } from '../../src/utils/richTextConverter.js';
import { rawArticles } from '../fixtures/articles.js';

let server;
let base;
let dist;

// Minimal dist/ with the same markers as the real index.html
const INDEX = `<!doctype html><html><head>
    <!--seo-head-->
    <title>Default</title>
    <!--/seo-head-->
  </head><body><div id="root"><!--seo-body--></div><script type="module" src="/assets/app.js"></script></body></html>`;

const request = (pathname, { method = 'GET', headers = {} } = {}) =>
  new Promise((resolve, reject) => {
    const req = http.request(`${base}${pathname}`, { method, headers }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        let body = Buffer.concat(chunks);
        if (res.headers['content-encoding'] === 'gzip') body = zlib.gunzipSync(body);
        resolve({ status: res.statusCode, headers: res.headers, body: body.toString('utf8') });
      });
    });
    req.on('error', reject);
    req.end();
  });

beforeAll(async () => {
  dist = await mkdtemp(path.join(tmpdir(), 'thepk-dist-'));
  await mkdir(path.join(dist, 'assets'));
  await writeFile(path.join(dist, 'index.html'), INDEX);
  await writeFile(path.join(dist, 'assets', 'app.js'), 'console.log("app");'.repeat(100));
  await writeFile(path.join(dist, 'assets', 'playfair-display-latin-900-normal-abc.woff2'), 'font');
  await writeFile(path.join(dist, 'favicon.svg'), '<svg/>');
  const articles = processArticleList(rawArticles);
  const handler = await createApp({ distDir: dist, getArticles: async () => articles });
  server = http.createServer(handler);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((r) => server.close(r));
  await rm(dist, { recursive: true, force: true });
});

describe('production server', () => {
  it('serves pages with SEO head, crawler body, inline data and font preload', async () => {
    const res = await request('/article/a-openai');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('text/html; charset=utf-8');
    expect(res.headers['cache-control']).toBe('no-cache');
    expect(res.body).toContain('<title>OpenAI launches a new reasoning model | Pradhyuman Yadav</title>');
    expect(res.body).not.toContain('<title>Default</title>');
    expect(res.body).toContain('window.__INITIAL_ARTICLES__=');
    expect(res.body).toContain('<link rel="preload" href="/assets/playfair-display-latin-900-normal-abc.woff2"');
    expect(res.body).toContain('<div id="root"><div class="ssr-shell">');
  });

  it('returns 404 for unknown pages and articles', async () => {
    expect((await request('/no-such-page')).status).toBe(404);
    expect((await request('/article/missing')).status).toBe(404);
  });

  it('redirects trailing slashes to the canonical path', async () => {
    const res = await request('/articles/?topic=openai');
    expect(res.status).toBe(301);
    expect(res.headers.location).toBe('/articles?topic=openai');
  });

  it('serves feeds with the right types', async () => {
    const cases = {
      '/robots.txt': 'text/plain; charset=utf-8',
      '/sitemap.xml': 'application/xml; charset=utf-8',
      '/rss.xml': 'application/rss+xml; charset=utf-8',
      '/llms.txt': 'text/plain; charset=utf-8',
    };
    for (const [p, type] of Object.entries(cases)) {
      const res = await request(p);
      expect(res.status, p).toBe(200);
      expect(res.headers['content-type'], p).toBe(type);
    }
  });

  it('serves hashed assets as immutable and gzips text when asked', async () => {
    const res = await request('/assets/app.js', { headers: { 'accept-encoding': 'gzip' } });
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toContain('immutable');
    expect(res.headers['content-encoding']).toBe('gzip');
    expect(res.body).toContain('console.log');
    expect((await request('/assets/playfair-display-latin-900-normal-abc.woff2')).headers['content-type']).toBe('font/woff2');
  });

  it('blocks path traversal and missing files', async () => {
    expect((await request('/../package.json')).status).toBe(404);
    expect((await request('/%2e%2e/%2e%2e/package.json')).status).toBe(404);
    expect((await request('/assets/missing.js')).status).toBe(404);
  });

  it('answers HEAD without a body, rejects other methods, and reports health', async () => {
    const head = await request('/', { method: 'HEAD' });
    expect(head.status).toBe(200);
    expect(head.body).toBe('');
    const post = await request('/', { method: 'POST' });
    expect(post.status).toBe(405);
    expect(post.headers.allow).toBe('GET, HEAD');
    expect((await request('/healthz')).body).toBe('ok');
  });

  it('sets basic security headers', async () => {
    const res = await request('/');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });
});

describe('createArticleCache', () => {
  it('caches results and keeps the last good copy when the CMS fails', async () => {
    const fetchRaw = vi.fn().mockResolvedValueOnce(rawArticles).mockRejectedValue(new Error('down'));
    const log = { error: vi.fn() };
    const get = createArticleCache(fetchRaw, { ttlMs: 0, log });
    const first = await get();
    expect(first).toHaveLength(rawArticles.length);
    const second = await get();
    expect(second).toBe(first);
    expect(log.error).toHaveBeenCalled();
  });

  it('times out a hanging CMS and serves the cached list', async () => {
    const get = createArticleCache(() => new Promise(() => {}), { ttlMs: 0, timeoutMs: 20, log: { error() {} } });
    await expect(get()).resolves.toEqual([]);
  });
});
