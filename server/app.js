/**
 * Request handling for the production server, separated from startup so it can be tested with
 * fixture articles and a temporary dist/ directory. Uses only Node built-ins.
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';

import { processArticleList } from '../src/utils/richTextConverter.js';
import { SITE_URL } from '../src/seo/siteMeta.js';
import { renderPage, renderRobots, renderSitemap, renderRss, renderLlmsTxt, initialDataScript } from './render.js';

export const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};
const COMPRESSIBLE = /^(text\/|application\/(json|xml|rss\+xml)|image\/svg)/;

/**
 * In-memory article cache. On a CMS failure the last good copy keeps being served and a retry is
 * scheduled 30s later.
 * @param {() => Promise<Array>} fetchRaw - returns raw Squidex items
 */
export const createArticleCache = (fetchRaw, { ttlMs = 5 * 60 * 1000, timeoutMs = 6000, log = console } = {}) => {
  let cache = { at: 0, list: [] };
  let inflight = null;
  return async () => {
    if (Date.now() - cache.at < ttlMs) return cache.list;
    inflight ??= Promise.race([
      fetchRaw(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Squidex timeout')), timeoutMs)),
    ])
      .then((raw) => {
        cache = { at: Date.now(), list: processArticleList(raw) };
        return cache.list;
      })
      .catch((err) => {
        log.error('Article fetch failed, serving cached copy:', err.message);
        cache.at = Date.now() - ttlMs + 30_000;
        return cache.list;
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  };
};

/**
 * Build the request handler.
 * @param {{ distDir: string, getArticles: () => Promise<Array> }} options
 * @returns {Promise<(req, res) => Promise<void>>}
 */
export const createApp = async ({ distDir, getArticles }) => {
  const dist = path.resolve(distDir);

  // Preload the headline weights so text does not reflow when the display face arrives (avoids layout shift)
  const assets = await readdir(path.join(dist, 'assets')).catch(() => []);
  const fontPreloads = assets
    .filter((name) => /^playfair-display-latin-(700|900)-normal-.*\.woff2$/.test(name))
    .map((name) => `<link rel="preload" href="/assets/${name}" as="font" type="font/woff2" crossorigin />`)
    .join('\n    ');
  const template = (await readFile(path.join(dist, 'index.html'), 'utf8')).replace(
    '<!--seo-head-->',
    `${fontPreloads}\n    <!--seo-head-->`
  );

  const send = (req, res, status, body, type, extraHeaders = {}) => {
    const headers = {
      'Content-Type': type,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      Vary: 'Accept-Encoding',
      ...extraHeaders,
    };
    let payload = Buffer.isBuffer(body) ? body : Buffer.from(body);
    if (payload.length > 1024 && COMPRESSIBLE.test(type) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      payload = zlib.gzipSync(payload);
      headers['Content-Encoding'] = 'gzip';
    }
    headers['Content-Length'] = payload.length;
    res.writeHead(status, headers);
    res.end(req.method === 'HEAD' ? undefined : payload);
  };

  // Serve a file from dist/ if it exists. Returns false when there is no such file.
  const serveStatic = async (req, res, pathname) => {
    const filePath = path.resolve(dist, `.${pathname}`);
    if (!filePath.startsWith(dist + path.sep)) return false;
    try {
      const info = await stat(filePath);
      if (!info.isFile()) return false;
    } catch {
      return false;
    }
    const ext = path.extname(filePath).toLowerCase();
    const cache = pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600';
    send(req, res, 200, await readFile(filePath), MIME[ext] || 'application/octet-stream', { 'Cache-Control': cache });
    return true;
  };

  const feeds = {
    '/robots.txt': { type: 'text/plain; charset=utf-8', build: () => renderRobots() },
    '/sitemap.xml': { type: 'application/xml; charset=utf-8', build: renderSitemap },
    '/rss.xml': { type: 'application/rss+xml; charset=utf-8', build: renderRss },
    '/llms.txt': { type: 'text/plain; charset=utf-8', build: renderLlmsTxt },
  };

  const handle = async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return send(req, res, 405, 'Method Not Allowed', 'text/plain; charset=utf-8', { Allow: 'GET, HEAD' });
    }

    const url = new URL(req.url, SITE_URL);
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      return send(req, res, 400, 'Bad Request', 'text/plain; charset=utf-8');
    }

    if (pathname === '/healthz') return send(req, res, 200, 'ok', 'text/plain; charset=utf-8', { 'Cache-Control': 'no-store' });

    // One canonical form per page: no trailing slash
    if (pathname.length > 1 && pathname.endsWith('/')) {
      res.writeHead(301, { Location: `${pathname.replace(/\/+$/, '')}${url.search}` });
      return res.end();
    }

    const feed = feeds[pathname];
    if (feed) {
      const articles = await getArticles();
      return send(req, res, 200, feed.build(articles), feed.type, { 'Cache-Control': 'public, max-age=900' });
    }

    if (path.extname(pathname)) {
      if (await serveStatic(req, res, pathname)) return undefined;
      return send(req, res, 404, 'Not Found', 'text/plain; charset=utf-8');
    }

    const articles = await getArticles();
    const page = renderPage({ path: pathname, searchParams: url.searchParams, articles });
    const html = template
      .replace(/<!--seo-head-->[\s\S]*?<!--\/seo-head-->/, () => `${page.head}\n    ${initialDataScript(articles, pathname)}`)
      .replace('<!--seo-body-->', () => page.body);
    return send(req, res, page.status, html, MIME['.html'], { 'Cache-Control': 'no-cache' });
  };

  return (req, res) =>
    handle(req, res).catch((err) => {
      console.error(err);
      if (!res.headersSent) send(req, res, 500, 'Internal Server Error', 'text/plain; charset=utf-8');
    });
};
