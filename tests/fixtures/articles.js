// Raw items in the shape the Squidex `blog` schema returns.
const doc = (...paragraphs) => ({
  type: 'doc',
  content: paragraphs.map((text) => ({ type: 'paragraph', content: [{ type: 'text', text }] })),
});

const item = (id, title, paragraphs, extra = {}, date = '2026-09-20T06:00:00Z') => ({
  id,
  created: date,
  lastModified: date,
  status: 'Published',
  data: {
    title: { iv: title },
    content: { iv: doc(...paragraphs) },
    author: { iv: 'Pradhyuman' },
    ...extra,
  },
});

export const rawArticles = [
  item('a-openai', 'OpenAI launches a new reasoning model', ['OpenAI released a model that improves reasoning benchmarks.', 'ChatGPT users get it first.'], {}, '2026-09-25T06:00:00Z'),
  item('a-anthropic', 'Anthropic is operating a lab that conducts biology experiments', ['Anthropic operates a wet lab.', 'Claude researchers run experiments.'], {}, '2026-09-24T06:00:00Z'),
  item('a-meta', 'Meta debuts its Muse AI agent', ['Meta launched an agent for consumers.', 'The agent ships in apps.'], {}, '2026-09-23T06:00:00Z'),
  item('a-nvidia', 'Startup raises $205M to chip away at Nvidia', ['The company raised funding for GPU alternatives.', 'Nvidia dominates data center chips.'], {}, '2026-09-22T06:00:00Z'),
  item('a-dash', 'Roblox makes games with AI — and plays them outside', ['Roblox announced tools — for creators.', 'Dates 2018–2026 are ranges.'], {}, '2026-09-21T06:00:00Z'),
  item('a-tags', 'A tagged story about policy', ['Lawmakers discussed regulation.'], { tags: { iv: ['Policy & Safety', 'Custom Tag'] } }, '2026-09-20T06:00:00Z'),
  item('a-excerpt', 'Google Gemini adds flight tracking', ['Google added features to Gemini.'], { excerpt: { iv: 'A short excerpt written by the editor.' } }, '2026-09-19T06:00:00Z'),
  item('a-plain', 'Weekly roundup of the industry', ['Nothing in particular happened this week in the industry at large.'], {}, '2026-09-18T06:00:00Z'),
];
