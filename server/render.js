/**
 * HTML, JSON-LD, and feed builders for the production server.
 * Everything here is pure string building so it can be tested without a network.
 */

import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  PERSON,
  NAV_LINKS,
  STATIC_ROUTES,
  pageTitle,
  canonicalUrl,
  clampDescription,
} from '../src/seo/siteMeta.js';
import { countCategories, getCategory, relatedArticles } from '../src/utils/categorize.js';
import { formatArticleDate as displayDate } from '../src/utils/dates.js';

// Home page hero copy. Keep in sync with src/pages/Home.jsx.
export const HOME_HEADLINE = 'Daily AI news briefs';
export const HOME_SUBTEXT = 'Short briefs on AI models, research, funding, and policy, written by Pradhyuman Yadav, AI/Software Engineer.';

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const xmlEsc = (value) => esc(value).replace(/&#39;/g, '&apos;');

// JSON inside <script> must not be able to close the tag.
const jsonLd = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

const articlePath = (a) => `/article/${a.id}`;
const topicPath = (slug) => `/articles?topic=${encodeURIComponent(slug)}`;
const isoDate = (d) => (d ? new Date(d).toISOString() : undefined);

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const baseGraph = () => [
  {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    inLanguage: 'en-US',
    publisher: { '@id': PERSON_ID },
  },
  { '@type': 'Person', '@id': PERSON_ID, ...PERSON },
];

const breadcrumb = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: `${SITE_URL}${item.path}`,
  })),
});

/**
 * Build the <head> tags for a page.
 */
const headTags = ({ title, description, path, search = '', type = 'website', robots = 'index,follow,max-image-preview:large', article, graph = [] }) => {
  const fullTitle = pageTitle(title);
  const url = canonicalUrl(path, search);
  const tags = [
    `<title>${esc(fullTitle)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<link rel="alternate" type="application/rss+xml" title="${esc(SITE_NAME)}: AI news" href="${SITE_URL}/rss.xml" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:title" content="${esc(fullTitle)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${esc(fullTitle)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
  ];
  if (article) {
    tags.push(`<meta property="article:published_time" content="${isoDate(article.publishDate)}" />`);
    if (article.lastModified) tags.push(`<meta property="article:modified_time" content="${isoDate(article.lastModified)}" />`);
    tags.push(`<meta property="article:author" content="${esc(PERSON.url)}" />`);
    article.categories.forEach((c) => tags.push(`<meta property="article:tag" content="${esc(c.label)}" />`));
  }
  tags.push(jsonLd({ '@context': 'https://schema.org', '@graph': [...baseGraph(), ...graph] }));
  return tags.join('\n    ');
};

// Crawler-readable markup placed inside #root. React replaces it on load.
const shell = (main) => `<div class="ssr-shell">
      <header>
        <p><a href="/">${esc(SITE_NAME)}</a></p>
        <nav aria-label="Primary">${NAV_LINKS.map((l) => `<a href="${l.path}">${esc(l.label)}</a>`).join(' ')}</nav>
      </header>
      <main>${main}</main>
    </div>`;

const articleListItems = (articles) =>
  articles
    .map(
      (a) => `<li><a href="${articlePath(a)}">${esc(a.title)}</a> <time datetime="${isoDate(a.publishDate)}">${esc(displayDate(a.publishDate))}</time><p>${esc(a.summary)}</p></li>`
    )
    .join('');

const topicLinks = (articles) =>
  countCategories(articles)
    .map((c) => `<li><a href="${topicPath(c.slug)}">${esc(c.label)}</a> (${c.count})</li>`)
    .join('');

/**
 * Render head and body markup for a request path.
 * @returns {{status: Number, head: String, body: String}}
 */
export const renderPage = ({ path, searchParams, articles }) => {
  // Article detail
  const articleMatch = path.match(/^\/article\/([^/]+)$/);
  if (articleMatch) {
    const article = articles.find((a) => a.id === articleMatch[1]);
    if (!article) return renderNotFound(path);

    const description = clampDescription(article.summary);
    const section = article.categories.find((c) => c.kind === 'topic') || article.categories[0];
    const related = relatedArticles(article, articles);
    const crumbs = [
      { name: 'Home', path: '/' },
      { name: 'Articles', path: '/articles' },
      ...(section ? [{ name: section.label, path: topicPath(section.slug) }] : []),
      { name: article.title, path: articlePath(article) },
    ];

    const head = headTags({
      title: article.title,
      description,
      path: articlePath(article),
      type: 'article',
      article,
      graph: [
        {
          '@type': 'BlogPosting',
          '@id': `${SITE_URL}${articlePath(article)}#article`,
          headline: article.title,
          description,
          url: `${SITE_URL}${articlePath(article)}`,
          mainEntityOfPage: `${SITE_URL}${articlePath(article)}`,
          datePublished: isoDate(article.publishDate),
          dateModified: isoDate(article.lastModified || article.publishDate),
          author: { '@id': PERSON_ID },
          publisher: { '@id': PERSON_ID },
          isPartOf: { '@id': WEBSITE_ID },
          inLanguage: 'en-US',
          wordCount: article.wordCount,
          articleSection: section?.label,
          keywords: article.categories.map((c) => c.label).join(', '),
          ...(article.featuredImage ? { image: article.featuredImage } : {}),
        },
        breadcrumb(crumbs),
      ],
    });

    const body = shell(`<article>
        <nav aria-label="Breadcrumb">${crumbs.slice(0, -1).map((c) => `<a href="${c.path}">${esc(c.name)}</a>`).join(' / ')}</nav>
        <h1>${esc(article.title)}</h1>
        <p>By <a href="/about">${esc(article.author)}</a>, <time datetime="${isoDate(article.publishDate)}">${esc(displayDate(article.publishDate))}</time></p>
        ${article.content}
        <p>Filed under: ${article.categories.map((c) => `<a href="${topicPath(c.slug)}">${esc(c.label)}</a>`).join(', ')}</p>
      </article>
      ${related.length ? `<section><h2>Related articles</h2><ul>${articleListItems(related)}</ul></section>` : ''}`);

    return { status: 200, head, body };
  }

  const route = STATIC_ROUTES[path];
  if (!route) return renderNotFound(path);

  // Article index, optionally filtered by topic
  if (path === '/articles') {
    const topic = getCategory(searchParams.get('topic'));
    const filtered = topic ? articles.filter((a) => a.categories.some((c) => c.slug === topic.slug)) : [];
    const known = filtered.length > 0;
    // Unknown topics fall back to the full index, matching the canonical URL
    const list = known ? filtered : articles;
    const title = known ? `${topic.label} AI News` : route.title;
    const description = known
      ? `${list.length} short briefs about ${topic.label} from Pradhyuman Yadav's daily AI news.`
      : route.description;
    const search = known ? `?topic=${encodeURIComponent(topic.slug)}` : '';

    const head = headTags({
      title,
      description,
      path,
      search,
      graph: [
        {
          '@type': 'Blog',
          '@id': `${SITE_URL}/articles#blog`,
          name: `${SITE_NAME}: AI News`,
          url: `${SITE_URL}/articles`,
          author: { '@id': PERSON_ID },
          blogPost: list.slice(0, 20).map((a) => ({
            '@type': 'BlogPosting',
            headline: a.title,
            url: `${SITE_URL}${articlePath(a)}`,
            datePublished: isoDate(a.publishDate),
          })),
        },
        breadcrumb([
          { name: 'Home', path: '/' },
          { name: 'Articles', path: '/articles' },
          ...(known ? [{ name: topic.label, path: topicPath(topic.slug) }] : []),
        ]),
      ],
    });

    const body = shell(`<h1>${esc(known ? `${topic.label} articles` : 'Articles')}</h1>
      <section><h2>Browse by topic</h2><ul>${topicLinks(articles)}</ul></section>
      <section><h2>${list.length} articles</h2><ul>${articleListItems(list)}</ul></section>`);
    return { status: 200, head, body };
  }

  // Home
  if (path === '/') {
    const head = headTags({
      title: route.title,
      description: route.description,
      path,
      graph: [{ '@type': 'ProfilePage', url: `${SITE_URL}/`, mainEntity: { '@id': PERSON_ID }, isPartOf: { '@id': WEBSITE_ID } }],
    });
    const body = shell(`<h1>${esc(HOME_HEADLINE)}</h1>
      <p>${esc(HOME_SUBTEXT)}</p>
      <section><h2>Latest articles</h2><ul>${articleListItems(articles.slice(0, 10))}</ul><p><a href="/articles">All articles</a></p></section>
      <section><h2>Browse by topic</h2><ul>${topicLinks(articles)}</ul></section>`);
    return { status: 200, head, body };
  }

  // Other static pages: tools, about, chat, pipeline, dc metro
  const graph = [];
  if (path === '/about') {
    graph.push({ '@type': 'ProfilePage', url: `${SITE_URL}/about`, mainEntity: { '@id': PERSON_ID } });
  } else if (path.startsWith('/tools/')) {
    graph.push({
      '@type': 'WebApplication',
      name: route.title,
      description: route.description,
      url: `${SITE_URL}${path}`,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      author: { '@id': PERSON_ID },
    });
  }
  const crumbs = [{ name: 'Home', path: '/' }];
  if (path.startsWith('/tools/')) crumbs.push({ name: 'Tools', path: '/tools' });
  crumbs.push({ name: route.title, path });
  graph.push(breadcrumb(crumbs));

  const toolLinks =
    path === '/tools'
      ? `<ul>${Object.entries(STATIC_ROUTES)
          .filter(([p]) => p.startsWith('/tools/'))
          .map(([p, r]) => `<li><a href="${p}">${esc(r.title)}</a>: ${esc(r.description)}</li>`)
          .join('')}</ul>`
      : '';

  return {
    status: 200,
    head: headTags({ title: route.title, description: route.description, path, graph }),
    body: shell(`<h1>${esc(route.title)}</h1><p>${esc(route.description)}</p>${toolLinks}`),
  };
};

export const renderNotFound = (path) => ({
  status: 404,
  head: headTags({ title: 'Page not found', description: 'This page does not exist.', path, robots: 'noindex,follow' }),
  body: shell(`<h1>Page not found</h1><p><a href="/articles">Browse all articles</a></p>`),
});

export const renderRobots = () => `# ${SITE_URL}
# Search engines and AI assistants are welcome to crawl and cite this site.
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

export const renderSitemap = (articles) => {
  const newest = articles[0]?.lastModified || articles[0]?.publishDate;
  const urls = [
    ...Object.keys(STATIC_ROUTES).map((p) => ({
      loc: canonicalUrl(p),
      lastmod: p === '/' || p === '/articles' ? newest : undefined,
      priority: p === '/' ? '1.0' : p === '/articles' ? '0.9' : p.startsWith('/tools/') ? '0.5' : '0.7',
    })),
    ...countCategories(articles).map((c) => ({ loc: `${SITE_URL}${topicPath(c.slug)}`, lastmod: newest, priority: '0.6' })),
    ...articles.map((a) => ({ loc: `${SITE_URL}${articlePath(a)}`, lastmod: a.lastModified || a.publishDate, priority: '0.8' })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${xmlEsc(u.loc)}</loc>${u.lastmod ? `<lastmod>${isoDate(u.lastmod)}</lastmod>` : ''}<priority>${u.priority}</priority></url>`
  )
  .join('\n')}
</urlset>
`;
};

export const renderRss = (articles) => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEsc(SITE_NAME)}: AI News</title>
    <link>${SITE_URL}/articles</link>
    <description>${xmlEsc(STATIC_ROUTES['/articles'].description)}</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${articles[0] ? `<lastBuildDate>${new Date(articles[0].publishDate).toUTCString()}</lastBuildDate>` : ''}
${articles
  .slice(0, 30)
  .map(
    (a) => `    <item>
      <title>${xmlEsc(a.title)}</title>
      <link>${SITE_URL}${articlePath(a)}</link>
      <guid isPermaLink="true">${SITE_URL}${articlePath(a)}</guid>
      <pubDate>${new Date(a.publishDate).toUTCString()}</pubDate>
      <description>${xmlEsc(a.summary)}</description>
${a.categories.map((c) => `      <category>${xmlEsc(c.label)}</category>`).join('\n')}
    </item>`
  )
  .join('\n')}
  </channel>
</rss>
`;

export const renderLlmsTxt = (articles) => {
  const tools = Object.entries(STATIC_ROUTES).filter(([p]) => p.startsWith('/tools/'));
  return `# ${SITE_NAME}

> ${DEFAULT_DESCRIPTION}

Pradhyuman Yadav is an AI/Software Engineer. This site publishes a short AI news brief most days, grouped by company and topic, plus free browser-based developer tools and notes on the self-hosted infrastructure that serves the site. Pages return readable HTML without JavaScript, and article pages include the full text.

## Articles

- [All articles](${SITE_URL}/articles): ${articles.length} briefs, newest first
${articles
  .slice(0, 30)
  .map((a) => `- [${a.title}](${SITE_URL}${articlePath(a)}): ${a.summary}`)
  .join('\n')}

## Topics

${countCategories(articles)
  .map((c) => `- [${c.label}](${SITE_URL}${topicPath(c.slug)}): ${c.count} articles`)
  .join('\n')}

## Tools

${tools.map(([p, r]) => `- [${r.title}](${SITE_URL}${p}): ${r.description}`).join('\n')}

## About

- [About Pradhyuman Yadav](${SITE_URL}/about): ${STATIC_ROUTES['/about'].description}
- [Infrastructure pipeline](${SITE_URL}/pipeline): ${STATIC_ROUTES['/pipeline'].description}

## Optional

- [Sitemap](${SITE_URL}/sitemap.xml): every article URL with last-modified dates
- [RSS feed](${SITE_URL}/rss.xml): the latest 30 articles
`;
};
