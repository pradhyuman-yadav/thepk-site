/**
 * Production server: serves the Vite build from dist/ and writes per-page SEO tags and
 * crawler-readable content into every HTML response. Uses only Node built-ins.
 * Request handling lives in app.js.
 *
 *   npm run build && npm start
 */

import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchSquidexArticles } from '../src/services/squidexClient.js';
import { createApp, createArticleCache } from './app.js';

const PORT = Number(process.env.PORT) || 3001;
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');

const getArticles = createArticleCache(fetchSquidexArticles);
const handler = await createApp({ distDir: DIST, getArticles });

http.createServer(handler).listen(PORT, '0.0.0.0', () => {
  console.log(`Serving dist/ on http://0.0.0.0:${PORT}`);
  getArticles(); // warm the cache
});
