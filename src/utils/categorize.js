/**
 * Rule-based article categorization, shared by the browser and the Node server.
 * The CMS has no tags on most articles, so categories are derived from the title and body text.
 * Tags set in Squidex always win over the rules.
 */

export const CATEGORIES = [
  // Companies: matched on names and flagship products
  { slug: 'openai', label: 'OpenAI', kind: 'company', patterns: [/\bopen ?ai\b/i, /\bchatgpt\b/i, /\bsam altman\b/i, /\bsora\b/i] },
  { slug: 'anthropic', label: 'Anthropic', kind: 'company', patterns: [/\banthropic\b/i, /\bclaude\b/i] },
  { slug: 'google', label: 'Google', kind: 'company', patterns: [/\bgoogle\b/i, /\bdeepmind\b/i, /\bgemini\b/i, /\balphabet\b/i] },
  { slug: 'meta', label: 'Meta', kind: 'company', patterns: [/\bMeta\b(?!-)/, /\bllama\b/i, /\bzuckerberg\b/i] },
  { slug: 'microsoft', label: 'Microsoft', kind: 'company', patterns: [/\bmicrosoft\b/i, /\bcopilot\b/i] },
  { slug: 'nvidia', label: 'Nvidia', kind: 'company', patterns: [/\bnvidia\b/i] },
  { slug: 'apple', label: 'Apple', kind: 'company', patterns: [/\bapple\b/i, /\bsiri\b/i] },
  { slug: 'amazon', label: 'Amazon', kind: 'company', patterns: [/\bamazon\b/i, /\baws\b/i, /\balexa\b/i] },
  { slug: 'xai', label: 'xAI', kind: 'company', patterns: [/\bxai\b/i, /\bgrok\b/i] },

  // Topics: what the story is about
  {
    slug: 'models-research', label: 'Models & Research', kind: 'topic',
    patterns: [/\bmodels?\b/i, /\bresearch(ers)?\b/i, /\bbenchmarks?\b/i, /\bopen[- ]weights?\b/i, /\breasoning\b/i, /\bpaper\b/i, /\blabs?\b/i, /\bdistill/i],
  },
  {
    slug: 'funding-business', label: 'Funding & Business', kind: 'topic',
    patterns: [/\braises?\b/i, /\braised\b/i, /\bfunding\b/i, /\bvaluation\b/i, /\$\d+(\.\d+)?\s?(m|b|bn|million|billion)\b/i, /\bacqui(res?|red|sition)\b/i, /\bipo\b/i, /\binvest(s|ors?|ment)?\b/i, /\brevenue\b/i, /\bboard of directors\b/i, /\bstartups?\b/i],
  },
  {
    slug: 'policy-safety', label: 'Policy & Safety', kind: 'topic',
    patterns: [/\bregulat/i, /\blaws?\b/i, /\bpolicy\b/i, /\bsafety\b/i, /\blawsuits?\b/i, /\bsue[sd]?\b/i, /\bcourt\b/i, /\bgovernment\b/i, /\bcongress\b/i, /\bsenate\b/i, /\bcopyright\b/i, /\bdoomer\b/i, /\brogue\b/i, /\bhack(s|ed|ing)?\b/i, /\bmisuse\b/i, /\bhide bad behavior\b/i, /\bprivacy\b/i],
  },
  {
    slug: 'products-agents', label: 'Products & Agents', kind: 'topic',
    patterns: [/\blaunch(es|ed)?\b/i, /\bapps?\b/i, /\bfeatures?\b/i, /\brolls? out\b/i, /\bagents?\b/i, /\bassistant\b/i, /\bnow (lets|can)\b/i, /\bdevelopers\b/i, /\bgames?\b/i],
  },
  {
    slug: 'chips-infrastructure', label: 'Chips & Infrastructure', kind: 'topic',
    patterns: [/\bchips?\b/i, /\bgpus?\b/i, /\bdata ?cent(er|re)s?\b/i, /\binfrastructure\b/i, /\bcompute\b/i, /\bsemiconductors?\b/i, /\bpower grid\b/i, /\bfusion\b/i, /\benergy\b/i],
  },
  { slug: 'industry', label: 'Industry', kind: 'topic', patterns: [] },
];

const BY_SLUG = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));
export const FALLBACK_TOPIC = 'industry';

export const slugify = (value) =>
  String(value).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Look up a category by slug. Unknown slugs (for example a new CMS tag) get a generated label.
 * @param {String} slug
 * @returns {{slug: String, label: String, kind: String}|null}
 */
export const getCategory = (slug) => {
  if (!slug) return null;
  const known = BY_SLUG[slug];
  if (known) return { slug: known.slug, label: known.label, kind: known.kind };
  return { slug, label: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), kind: 'topic' };
};

const countMatches = (patterns, text) =>
  patterns.reduce((n, re) => n + (text.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`)) || []).length, 0);

/**
 * Categorize one article.
 * A category applies when it matches the title, or matches the body at least twice.
 * Topics are capped at two, strongest first; every article gets at least one topic.
 * @param {{title: String, text: String, tags: Array<String>}} article
 * @returns {Array<{slug: String, label: String, kind: String}>} Companies first, then topics
 */
export const categorizeArticle = ({ title = '', text = '', tags = [] }) => {
  if (tags.length) return tags.map((t) => getCategory(slugify(t))).filter(Boolean);

  const body = text.slice(0, 2000);
  const scored = CATEGORIES.filter((c) => c.patterns.length)
    .map((c) => {
      const inTitle = countMatches(c.patterns, title);
      const inBody = countMatches(c.patterns, body);
      return { c, inTitle, score: inTitle * 3 + inBody, applies: inTitle > 0 || inBody >= 2 };
    })
    .filter((s) => s.applies)
    .sort((a, b) => b.score - a.score);

  const companies = scored.filter((s) => s.c.kind === 'company').slice(0, 2);
  const topics = scored.filter((s) => s.c.kind === 'topic').slice(0, 2);
  const picked = [...companies, ...topics].map((s) => getCategory(s.c.slug));
  if (!topics.length) picked.push(getCategory(FALLBACK_TOPIC));
  return picked;
};

/**
 * Count how many articles fall in each category, ordered by count.
 * @param {Array} articles - Processed articles with a categories array
 * @returns {Array<{slug: String, label: String, kind: String, count: Number}>}
 */
export const countCategories = (articles) => {
  const counts = new Map();
  articles.forEach((a) =>
    (a.categories || []).forEach((c) => {
      const entry = counts.get(c.slug) || { ...c, count: 0 };
      entry.count += 1;
      counts.set(c.slug, entry);
    })
  );
  return [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
};

/**
 * Articles sharing the most categories with the given one, excluding itself.
 * @param {Object} article - Processed article
 * @param {Array} articles - All processed articles
 * @param {Number} limit
 * @returns {Array}
 */
export const relatedArticles = (article, articles, limit = 4) => {
  const mine = new Set((article.categories || []).map((c) => c.slug));
  return articles
    .filter((a) => a.id !== article.id)
    .map((a) => ({ a, shared: (a.categories || []).filter((c) => mine.has(c.slug) && c.slug !== FALLBACK_TOPIC).length }))
    .filter((x) => x.shared > 0)
    .sort((x, y) => y.shared - x.shared || new Date(y.a.publishDate) - new Date(x.a.publishDate))
    .slice(0, limit)
    .map((x) => x.a);
};
