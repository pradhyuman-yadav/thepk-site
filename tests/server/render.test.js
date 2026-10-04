// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  renderPage,
  renderNotFound,
  renderRobots,
  renderSitemap,
  renderRss,
  renderLlmsTxt,
  initialDataScript,
  HOME_HEADLINE,
} from '../../server/render.js';
import { processArticleList } from '../../src/utils/richTextConverter.js';
import { STATIC_ROUTES } from '../../src/seo/siteMeta.js';
import { rawArticles } from '../fixtures/articles.js';

const articles = processArticleList(rawArticles);
const page = (path, search = '') => renderPage({ path, searchParams: new URLSearchParams(search), articles });
const jsonLd = (head) =>
  [...head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const types = (head) => jsonLd(head).flatMap((d) => d['@graph'].map((g) => g['@type']));
const canonical = (head) => head.match(/<link rel="canonical" href="([^"]+)"/)[1];
const title = (head) => head.match(/<title>([^<]*)<\/title>/)[1];

describe('renderPage', () => {
  it('renders the home page with crawlable article links', () => {
    const p = page('/');
    expect(p.status).toBe(200);
    expect(title(p.head)).toBe('Pradhyuman Yadav: AI/Software Engineer');
    expect(canonical(p.head)).toBe('https://thepk.in/');
    expect(types(p.head)).toEqual(['WebSite', 'Person', 'ProfilePage']);
    expect(p.body).toContain(`<h1>${HOME_HEADLINE}</h1>`);
    expect(p.body).toContain('href="/article/a-openai"');
    expect(p.body).toContain('href="/articles?topic=openai"');
  });

  it('renders an article with BlogPosting and breadcrumbs', () => {
    const p = page('/article/a-anthropic');
    expect(p.status).toBe(200);
    expect(title(p.head)).toBe('Anthropic is operating a lab that conducts biology experiments | Pradhyuman Yadav');
    expect(canonical(p.head)).toBe('https://thepk.in/article/a-anthropic');
    expect(p.head).toContain('<meta property="og:type" content="article" />');
    const graph = jsonLd(p.head)[0]['@graph'];
    const post = graph.find((g) => g['@type'] === 'BlogPosting');
    expect(post).toMatchObject({ headline: 'Anthropic is operating a lab that conducts biology experiments', author: { '@id': 'https://thepk.in/#person' } });
    expect(post.keywords).toContain('Anthropic');
    expect(graph.find((g) => g['@type'] === 'BreadcrumbList').itemListElement[0].name).toBe('Home');
    expect(p.body).toContain('<p>Anthropic operates a wet lab.</p>');
    const description = p.head.match(/name="description" content="([^"]*)"/)[1];
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it('returns 404 with noindex for missing articles and unknown paths', () => {
    for (const p of [page('/article/nope'), page('/no-such-page')]) {
      expect(p.status).toBe(404);
      expect(p.head).toContain('noindex,follow');
    }
  });

  it('filters the index by topic and canonicalises unknown topics', () => {
    const openai = page('/articles', 'topic=openai');
    expect(canonical(openai.head)).toBe('https://thepk.in/articles?topic=openai');
    expect(title(openai.head)).toBe('OpenAI AI News | Pradhyuman Yadav');
    expect(openai.body).toContain('a-openai');
    expect(openai.body).not.toContain('href="/article/a-nvidia"');

    const unknown = page('/articles', 'topic=bogus');
    expect(canonical(unknown.head)).toBe('https://thepk.in/articles');
    expect(unknown.body).toContain(`<h2>${articles.length} articles</h2>`);
  });

  it('describes tool pages as web applications', () => {
    const p = page('/tools/regex-builder');
    expect(types(p.head)).toContain('WebApplication');
    expect(title(p.head)).toBe(`${STATIC_ROUTES['/tools/regex-builder'].title} | Pradhyuman Yadav`);
  });

  it('renders every static route with status 200', () => {
    for (const path of Object.keys(STATIC_ROUTES)) expect(page(path).status, path).toBe(200);
  });

  it('escapes HTML in titles and keeps JSON-LD from closing the script tag', () => {
    const evil = processArticleList([
      { ...rawArticles[0], id: 'evil', data: { ...rawArticles[0].data, title: { iv: '</script><script>alert(1)</script>' } } },
    ]);
    const p = renderPage({ path: '/article/evil', searchParams: new URLSearchParams(), articles: evil });
    expect(p.head).not.toContain('<script>alert(1)</script>');
    expect(p.head).toContain('&lt;/script&gt;');
    expect(p.head).toContain('\\u003c/script>');
    expect(() => jsonLd(p.head)).not.toThrow();
  });

  it('never outputs em or en dashes', () => {
    const outputs = [page('/'), page('/articles'), page('/article/a-dash'), renderNotFound('/x')]
      .map((p) => p.head + p.body)
      .concat([renderRobots(), renderSitemap(articles), renderRss(articles), renderLlmsTxt(articles)]);
    for (const out of outputs) expect(out).not.toMatch(/[\u2013\u2014]/);
  });
});

describe('feeds', () => {
  it('robots.txt allows search and AI crawlers and lists the sitemap', () => {
    const robots = renderRobots();
    for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) expect(robots).toContain(`User-agent: ${bot}`);
    expect(robots).toContain('Sitemap: https://thepk.in/sitemap.xml');
    expect(robots).not.toMatch(/Disallow: \/\s/);
  });

  it('sitemap lists static routes, topics and every article', () => {
    const xml = renderSitemap(articles);
    for (const path of Object.keys(STATIC_ROUTES)) expect(xml).toContain(`<loc>https://thepk.in${path === '/' ? '/' : path}</loc>`);
    for (const a of articles) expect(xml).toContain(`<loc>https://thepk.in/article/${a.id}</loc>`);
    expect(xml).toContain('topic=openai');
    expect(xml.match(/<url>/g).length).toBe(xml.match(/<\/url>/g).length);
  });

  it('rss has one item per article (max 30) with categories', () => {
    const rss = renderRss(articles);
    expect(rss.match(/<item>/g).length).toBe(Math.min(30, articles.length));
    expect(rss).toContain('<category>OpenAI</category>');
    expect(rss).toContain('<atom:link href="https://thepk.in/rss.xml"');
  });

  it('llms.txt has the expected sections', () => {
    const txt = renderLlmsTxt(articles);
    for (const heading of ['# Pradhyuman Yadav', '## Articles', '## Topics', '## Tools', '## About', '## Optional']) {
      expect(txt).toContain(heading);
    }
    expect(txt).toContain('(https://thepk.in/article/a-openai)');
  });
});

describe('initialDataScript', () => {
  it('ships every article without bodies except the one being viewed', () => {
    const script = initialDataScript(articles, '/article/a-meta');
    const data = JSON.parse(script.match(/__INITIAL_ARTICLES__=(.*);<\/script>/)[1]);
    expect(data).toHaveLength(articles.length);
    expect(data.find((a) => a.id === 'a-meta').content).toContain('Meta launched');
    expect(data.filter((a) => a.content)).toHaveLength(1);
    expect(data[0]).toHaveProperty('categories');
  });

  it('cannot break out of its script tag', () => {
    const tricky = [{ ...articles[0], title: 'x</script><script>bad()</script>\u2028y' }];
    const script = initialDataScript(tricky, '/');
    expect(script.match(/<\/script>/g)).toHaveLength(1);
    expect(script).not.toContain('\u2028');
  });
});

describe('services', () => {
  it('appear as links in the pipeline page HTML and in llms.txt', async () => {
    const { SERVICES } = await import('../../src/seo/siteMeta.js');
    const p = page('/pipeline');
    const txt = renderLlmsTxt(articles);
    expect(txt).toContain('## Services');
    for (const s of SERVICES) {
      expect(p.body).toContain(`<a href="${s.url}">${s.name}</a>`);
      expect(txt).toContain(`- [${s.name}](${s.url}):`);
    }
    // Only the pipeline page carries the list
    expect(page('/tools').body).not.toContain('Live services');
  });
});

describe('infrastructure flow', () => {
  it('is part of the pipeline page HTML for crawlers', async () => {
    const { INFRA_PATH, INFRA_GROUPS } = await import('../../src/seo/infrastructure.js');
    const body = page('/pipeline').body;
    for (const n of [...INFRA_PATH, ...INFRA_GROUPS.flatMap((g) => g.nodes)]) expect(body).toContain(n.name);
    expect(body).toContain('<a href="https://api.thepk.in">Backend API</a>');
    expect(body).toContain('<a href="/llm-chat">SLM / LLM</a>');
    expect(page('/').body).not.toContain('Edge proxy');
  });
});

describe('privacy policy', () => {
  it('is fully readable without JavaScript, with an anchor per app', async () => {
    const { APPS, SECTIONS, CONTACT_EMAIL } = await import('../../src/seo/privacy.js');
    const p = page('/privacy');
    expect(p.status).toBe(200);
    expect(title(p.head)).toBe('App Privacy Policy | Pradhyuman Yadav');
    for (const s of SECTIONS) expect(p.body).toContain(`<h2>${s.heading}</h2>`);
    for (const a of APPS) expect(p.body).toContain(`<article id="${a.id}">`);
    expect(p.body).toContain(`mailto:${CONTACT_EMAIL}`);
    expect(renderSitemap(articles)).toContain('<loc>https://thepk.in/privacy</loc>');
  });
});
