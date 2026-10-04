# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal site for thepk.in (Pradhyuman Yadav): a React 19 + Vite 7 SPA with a black & white newspaper design (Playfair Display headlines, Times body, dark mode toggle), served in production by a small Node server that adds per-page SEO. Content (daily AI news articles, About page data) comes from a self-hosted Squidex headless CMS; several pages talk to other self-hosted services. Plain JavaScript/JSX, no TypeScript.

## Commands

```bash
npm install
npm run dev       # Vite dev server on http://localhost:3001 (no SEO injection, no robots/sitemap/llms/rss)
npm run build     # Production build to dist/
npm start         # Production server (server/index.js) serving dist/ on PORT (default 3001)
npm test          # Vitest: unit, component (jsdom + Testing Library) and server tests in tests/
npm run test:watch
npx vitest run tests/server/app.test.js   # one file; add -t "name" for one test
npm run lint      # ESLint (flat config, .js/.jsx); keep it at 0 errors
npm run preview   # Plain Vite static preview (no SEO injection)
```

Tests live in `tests/` (`utils/` and `server/` run in Node via `// @vitest-environment node`; `client/` runs in jsdom with `tests/setup.js` stubbing matchMedia, observers, fonts and canvas). Fixtures in `tests/fixtures/articles.js` use the raw Squidex shape. Page tests mock `fetchSquidexArticles` and call `resetArticlesCache()` between tests. CI (`.github/workflows/deploy.yml`) runs lint, tests and build on every push and PR, and deploys only from a green `main`.

For visual changes, also run `npm run build && PORT=3002 npm start` and look at the page: the background fill and word wipe depend on real layout, which jsdom does not have.

## Architecture

**Two renderers, one set of shared modules.** The browser app and `server/` both import `src/services/squidexClient.js`, `src/utils/richTextConverter.js`, `src/utils/categorize.js`, `src/utils/dates.js` and `src/seo/siteMeta.js`. Keep those files free of React, DOM APIs and bare `import.meta.env` access, or the server breaks (and the Dockerfile copies only these paths into the runtime image).

**Production server** (`server/app.js` builds the request handler from a dist dir and an article getter; `server/index.js` wires the real Squidex fetch and listens; Node built-ins only):
- Serves `dist/` (hashed `/assets/*` cached immutable, gzip for text).
- For every HTML route, replaces the `<!--seo-head-->...<!--/seo-head-->` block in `index.html` with a per-page title, description, canonical, Open Graph/Twitter and JSON-LD (`server/render.js`), and puts crawler-readable markup (nav, article text, article links) into `<div id="root"><!--seo-body--></div>`. React replaces that markup when it mounts (client render, not hydration).
- Generates `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/rss.xml` from live CMS data. Articles are cached in memory for 5 minutes, and the last good copy is served if Squidex fails.
- Inlines a compact article list as `window.__INITIAL_ARTICLES__` (bodies omitted except the article being viewed) so the first render needs no CMS round trip, and preloads the Playfair 700/900 woff2 files. Both matter for LCP/CLS.
- Unknown routes and unknown article IDs return 404 status. Trailing slashes 301 to the bare path.

**SEO metadata** lives in `src/seo/siteMeta.js`: `STATIC_ROUTES` (title + description per route), `NAV_LINKS` (primary nav, used by `Navigation.jsx` and the server shell), `PERSON`. A new page needs an entry in `STATIC_ROUTES` as well as a `<Route>` in `App.jsx`. On the client, `RouteSeo` (in `App.jsx`, before `<Routes>`) applies `STATIC_ROUTES` on navigation, and pages with CMS data call `useSeo()` from `src/hooks/useSeo.js` to override it. `HOME_HEADLINE`/`HOME_SUBTEXT` in `server/render.js` must match the copy in `src/pages/Home.jsx`.

**Articles**: `useArticles()` (`src/hooks/useArticles.js`) starts from `window.__INITIAL_ARTICLES__`, then fetches the full `blog` schema once in the background (`complete` flips to true) and runs `processArticleList()` (rich text to HTML, dash normalization, `summary`, categories, newest first). Home, Articles and SingleArticle all use it. Article URLs are `/article/<squidex id>`, and topic pages are `/articles?topic=<slug>`.

**Categorization** (`src/utils/categorize.js`): most CMS articles have no tags, so companies and topics come from keyword rules on the title and body (a title match, or 2+ body matches). CMS `tags`, when present, replace the rules. Add companies or topics by editing `CATEGORIES`.

**Layout** (`src/components/Layout.jsx`): no page panel, frames or menu boxes. A content column (section links as a line of type in `.site-ribbon`, then `<main>`) and the vertical nameplate on the right, both marked `data-backdrop-avoid`.

**Background word-wrap fill** (`NewspaperBackdrop` + `src/utils/textFill.js` + `src/utils/backdropDom.js`): words from the current edition fill every empty space of the page, including between paragraphs and around the section links, at 0/90/180/270 degrees with a 2px gap, never touching real content. `.backdrop-layer` covers the whole layout and scrolls with it, split into 1024px canvas tiles that are filled only near the viewport. `collectBlocked` measures what to keep clear: text line boxes (Range rects), media and controls, visible borders, filled backgrounds, skipping hidden content (`checkVisibility`) and wipe clones. `fillSteps` packs words on a 2px occupancy grid. Both are generators run in idle slices so they never block the main thread. It is generated and animated: each page and theme gets a new edition seed; words wipe in all at once from random edges (tiles also wipe in as they scroll into view), wipe out on `pageexit` (dispatched by `AnimatedRoutes` when the exit starts), and every 3.5s about 3% of on-screen words swap for new words that fit inside the same box (`pickReplacement`), so swaps can never overlap. Each tile keeps an offscreen canvas; animations copy clipped slices of it (`clipRegion`) instead of re-rendering text. In-place refreshes (content mutations, debounced 250ms; resize) keep the edition and redraw instantly. On `pagechange` (the swap) tiles clear and a new edition is generated. Reduced motion: instant draws, no ambient swaps; ambient pauses in hidden tabs. Any element with a non-transparent background blocks its whole box, so tool panels stay clear; add `data-backdrop-block` to reserve an element's whole box (used for the animated connector lanes).

**Word wipe transitions** (`src/utils/wordWipe.js`, wired in `AnimatedRoutes` in `App.jsx`; note React 19 rewrites innerHTML whenever a new `dangerouslySetInnerHTML` object arrives, so keep those objects memoised or the wipe re-fires): on navigation the old page wipes out and the new one wipes in, every on-screen word at once from a random direction (`clip-path` keyframes `wipe-word-in/out`). The live React DOM is never split: a clone is word-split, laid over the original, animated and removed. `watchForNewContent` does the same for elements React adds later (loaded data, show more, chat messages), but not within 700ms of a keypress. Mark a subtree `data-no-wipe` to exclude it. `prefers-reduced-motion` disables all of it. `<Routes location={displayLocation}>` keeps the old page mounted during the exit.

**Styling**: one global stylesheet, `src/styles/App.css`. The blocks at the end ("Redesign pass", "Newspaper overhaul", "Open composition", "Word-wrap fill") hold the newer rules and intentionally override earlier ones: square corners everywhere (`border-radius: 0 !important`, spinners excepted), and reduced-motion handling. The display face is self-hosted via `@fontsource/playfair-display` (imported in `main.jsx`). Dark mode uses attributes on `<html>` (`data-theme`, `data-dark`); the context object and `useTheme()` live in `src/contexts/theme.js`, the provider in `ThemeContext.jsx`. An inline script in `index.html` applies the saved or system theme before paint, and `ThemeContext` follows `prefers-color-scheme` until the visitor uses the toggle (only then is `localStorage.darkMode` written). Icons come from `@phosphor-icons/react`.

**House style**: no em or en dashes in visible text (`normalizeDashes()` is applied to CMS article and About data), and no emoji in the UI.

**Squidex CMS** (`src/services/squidexClient.js`, re-exported through `cmsService.js`):
- OAuth2 client-credentials token from `${SQUIDEX_URL}/identity-server/connect/token`, cached in module scope. Config reads `VITE_*` from `import.meta.env` in the browser or from `process.env` in Node, with hard-coded fallbacks. The app name is fixed to `platform`.
- The About page uses `src/hooks/useAboutPage.js` → `fetchAboutPageData()` (schemas `about`, `education`, `workexperience`, `projects`, `skills`) and falls back to hard-coded data on error.

**Infrastructure flow** (`src/components/InfraFlow.jsx`, data in `src/seo/infrastructure.js`): the /pipeline diagram, typeset as real HTML (request path, then Site and Operations groups, open/sign-in tags, links out) with ink connectors and a pulse showing request direction. The server renders the same data as plain HTML for crawlers. The old hand-drawn SVG diagrams were removed, and Home no longer shows one. `SERVICES` in `siteMeta.js` drives the "Live services" list on the same page and the Services section of llms.txt.

**Other backends and embeds:**
- `/llm-chat` calls `https://api.thepk.in` (`/health`, `/api/llm/models`, `/api/llm/stream`, `/api/llm/generate`). `swagger_backend_openapi.json` documents it, and `swagger_squidex_api_doc.json` documents Squidex.
- `/tools/portrait-processor` posts images to `VITE_API_URL` (default `http://localhost:8000`). No such backend is deployed, so this tool does not work in production.
- `/dc-metro` embeds `https://dc-metro.thepk.in` and syncs the theme with `postMessage({ type: 'SET_THEME', theme })`.
- Tool pages under `src/pages/tools/` are self-contained client components; most persist saved items in `localStorage`.

## Environment

`VITE_SQUIDEX_CLIENT_ID`, `VITE_SQUIDEX_CLIENT_SECRET`, `VITE_SQUIDEX_URL` (read at build time by Vite and at runtime by the server) and `VITE_API_URL` (portrait processor). The server also reads `PORT`.

## Deployment

Push to `main` → after the `check` job passes, `.github/workflows/deploy.yml` POSTs to a Portainer webhook (skipped when the `PORTAINER_WEBHOOK_URL` repo secret is missing), which rebuilds the `docker-compose.yml` service. The Dockerfile is multi-stage: `npm ci && npm run build`, then a slim Node 20 image runs `node server/index.js` on port 3001 inside the container, published on host port 3012 by `docker-compose.yml` (container `thepk-site`; override with `HOST_PORT`), with a `/healthz` healthcheck. `vite.config.js` `server.allowedHosts` only affects `npm run dev`.
