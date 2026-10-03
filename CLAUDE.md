# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal site for thepk.in (Pradhyuman Yadav): a React 19 + Vite 7 SPA with an A4-page, black & white design (Times New Roman, dark mode toggle), served in production by a small Node server that adds per-page SEO. Content (daily AI news articles, About page data) comes from a self-hosted Squidex headless CMS; several pages talk to other self-hosted services. Plain JavaScript/JSX, no TypeScript.

## Commands

```bash
npm install
npm run dev       # Vite dev server on http://localhost:3001 (no SEO injection, no robots/sitemap/llms/rss)
npm run build     # Production build to dist/
npm start         # Production server (server/index.js) serving dist/ on PORT (default 3001)
npm run lint      # ESLint (flat config, .js/.jsx); main already carries ~52 pre-existing errors in tool pages
npm run preview   # Plain Vite static preview (no SEO injection)
```

There is no test framework. Verify UI changes with `npm run dev` and the route list in `src/App.jsx`. Verify SEO changes with `npm run build && PORT=3002 npm start`, then `curl` a route and read the `<head>` and the markup inside `#root`.

## Architecture

**Two renderers, one set of shared modules.** The browser app and `server/` both import `src/services/squidexClient.js`, `src/utils/richTextConverter.js`, `src/utils/categorize.js`, `src/utils/dates.js` and `src/seo/siteMeta.js`. Keep those files free of React, DOM APIs and bare `import.meta.env` access, or the server breaks (and the Dockerfile copies only these paths into the runtime image).

**Production server** (`server/index.js`, Node built-ins only):
- Serves `dist/` (hashed `/assets/*` cached immutable, gzip for text).
- For every HTML route, replaces the `<!--seo-head-->...<!--/seo-head-->` block in `index.html` with a per-page title, description, canonical, Open Graph/Twitter and JSON-LD (`server/render.js`), and puts crawler-readable markup (nav, article text, article links) into `<div id="root"><!--seo-body--></div>`. React replaces that markup when it mounts (client render, not hydration).
- Generates `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/rss.xml` from live CMS data. Articles are cached in memory for 5 minutes, and the last good copy is served if Squidex fails.
- Unknown routes and unknown article IDs return 404 status. Trailing slashes 301 to the bare path.

**SEO metadata** lives in `src/seo/siteMeta.js`: `STATIC_ROUTES` (title + description per route), `NAV_LINKS` (primary nav, used by `Navigation.jsx` and the server shell), `PERSON`. A new page needs an entry in `STATIC_ROUTES` as well as a `<Route>` in `App.jsx`. On the client, `RouteSeo` (in `App.jsx`, before `<Routes>`) applies `STATIC_ROUTES` on navigation, and pages with CMS data call `useSeo()` from `src/hooks/useSeo.js` to override it. `HOME_HEADLINE`/`HOME_SUBTEXT` in `server/render.js` must match the copy in `src/pages/Home.jsx`.

**Articles**: `useArticles()` (`src/hooks/useArticles.js`) fetches the `blog` schema once per page load and runs `processArticleList()` (rich text to HTML, dash normalization, `summary`, categories, newest first). Home, Articles and SingleArticle all use it. Article URLs are `/article/<squidex id>`, and topic pages are `/articles?topic=<slug>`.

**Categorization** (`src/utils/categorize.js`): most CMS articles have no tags, so companies and topics come from keyword rules on the title and body (a title match, or 2+ body matches). CMS `tags`, when present, replace the rules. Add companies or topics by editing `CATEGORIES`.

**Styling**: one global stylesheet, `src/styles/App.css`. The block at the end ("Redesign pass") holds the newer rules and intentionally overrides earlier ones: square corners everywhere (`border-radius: 0 !important`, spinners excepted), reduced-motion handling, and the monochrome recolor of the infrastructure diagram via attribute selectors on its inline SVG. Dark mode uses attributes on `<html>` (`data-theme`, `data-dark`). An inline script in `index.html` applies the saved or system theme before paint, and `ThemeContext` follows `prefers-color-scheme` until the visitor uses the toggle (only then is `localStorage.darkMode` written). Icons come from `@phosphor-icons/react`.

**House style**: no em or en dashes in visible text (`normalizeDashes()` is applied to CMS article and About data), and no emoji in the UI.

**Squidex CMS** (`src/services/squidexClient.js`, re-exported through `cmsService.js`):
- OAuth2 client-credentials token from `${SQUIDEX_URL}/identity-server/connect/token`, cached in module scope. Config reads `VITE_*` from `import.meta.env` in the browser or from `process.env` in Node, with hard-coded fallbacks. The app name is fixed to `platform`.
- The About page uses `src/hooks/useAboutPage.js` → `fetchAboutPageData()` (schemas `about`, `education`, `workexperience`, `projects`, `skills`) and falls back to hard-coded data on error.
- `useCMS()` and the exported `cmsService` object in `cmsService.js` are legacy and unused.

**Other backends and embeds:**
- `/llm-chat` calls `https://api.thepk.in` (`/health`, `/api/llm/models`, `/api/llm/stream`, `/api/llm/generate`). `swagger_backend_openapi.json` documents it, and `swagger_squidex_api_doc.json` documents Squidex.
- `/tools/portrait-processor` posts images to `VITE_API_URL` (default `http://localhost:8000`).
- `/dc-metro` embeds `https://dc-metro.thepk.in` and syncs the theme with `postMessage({ type: 'SET_THEME', theme })`.
- Tool pages under `src/pages/tools/` are self-contained client components; most persist saved items in `localStorage`.

## Environment

`VITE_SQUIDEX_CLIENT_ID`, `VITE_SQUIDEX_CLIENT_SECRET`, `VITE_SQUIDEX_URL` (read at build time by Vite and at runtime by the server) and `VITE_API_URL` (portrait processor). The server also reads `PORT`.

## Deployment

Push to `main` → `.github/workflows/deploy.yml` POSTs to a Portainer webhook, which rebuilds the `docker-compose.yml` service. The Dockerfile is multi-stage: `npm ci && npm run build`, then a slim Node 20 image runs `node server/index.js` on port 3001 with a `/healthz` healthcheck. `vite.config.js` `server.allowedHosts` only affects `npm run dev`.
