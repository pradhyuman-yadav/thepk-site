// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  categorizeArticle,
  countCategories,
  relatedArticles,
  getCategory,
  slugify,
  FALLBACK_TOPIC,
} from '../../src/utils/categorize.js';

const slugs = (cats) => cats.map((c) => c.slug);

describe('categorizeArticle', () => {
  it('finds companies from the title', () => {
    expect(slugs(categorizeArticle({ title: 'OpenAI ships a model', text: '' }))).toContain('openai');
    expect(slugs(categorizeArticle({ title: 'Open AI and ChatGPT', text: '' }))).toContain('openai');
    expect(slugs(categorizeArticle({ title: 'Anthropic hires', text: '' }))).toContain('anthropic');
  });

  it('matches Meta only as the capitalised company name', () => {
    expect(slugs(categorizeArticle({ title: 'Meta debuts an agent', text: '' }))).toContain('meta');
    expect(slugs(categorizeArticle({ title: 'The metadata problem', text: '' }))).not.toContain('meta');
    expect(slugs(categorizeArticle({ title: 'A meta-analysis of models', text: '' }))).not.toContain('meta');
  });

  it('needs two body mentions when the title does not match', () => {
    expect(slugs(categorizeArticle({ title: 'A story', text: 'Nvidia once.' }))).not.toContain('nvidia');
    expect(slugs(categorizeArticle({ title: 'A story', text: 'Nvidia here. Nvidia there.' }))).toContain('nvidia');
  });

  it('caps topics at two and always assigns at least one', () => {
    const many = categorizeArticle({
      title: 'Startup raises funding for chips, launches app, faces lawsuit over model research',
      text: '',
    });
    expect(many.filter((c) => c.kind === 'topic').length).toBeLessThanOrEqual(2);
    const none = categorizeArticle({ title: 'Weekly roundup', text: 'Nothing relevant.' });
    expect(slugs(none)).toEqual([FALLBACK_TOPIC]);
  });

  it('lists companies before topics', () => {
    const cats = categorizeArticle({ title: 'OpenAI raises funding', text: '' });
    expect(cats[0].kind).toBe('company');
  });

  it('uses CMS tags instead of rules when present', () => {
    const cats = categorizeArticle({ title: 'OpenAI news', text: '', tags: ['Policy & Safety', 'Custom Tag'] });
    expect(slugs(cats)).toEqual(['policy-safety', 'custom-tag']);
    expect(cats[1].label).toBe('Custom Tag');
  });
});

describe('helpers', () => {
  it('slugifies labels', () => {
    expect(slugify('Models & Research')).toBe('models-and-research');
    expect(slugify('  Hello, World! ')).toBe('hello-world');
  });

  it('looks up known and unknown categories', () => {
    expect(getCategory('openai')).toEqual({ slug: 'openai', label: 'OpenAI', kind: 'company' });
    expect(getCategory('my-new-tag').label).toBe('My New Tag');
    expect(getCategory(null)).toBeNull();
  });

  const a = (id, ...cats) => ({ id, publishDate: `2026-09-${10 + id.length}T00:00:00Z`, categories: cats.map((s) => getCategory(s)) });

  it('counts categories, most common first', () => {
    const counts = countCategories([a('1', 'openai', 'industry'), a('2', 'openai'), a('3', 'nvidia')]);
    expect(counts[0]).toMatchObject({ slug: 'openai', count: 2 });
    expect(counts.map((c) => c.slug)).toEqual(['openai', 'industry', 'nvidia']);
  });

  it('finds related articles by shared categories, excluding itself and the fallback topic', () => {
    const me = a('x', 'openai', 'industry');
    const list = [me, a('yy', 'openai'), a('zzz', 'industry'), a('w', 'nvidia')];
    const related = relatedArticles(me, list);
    expect(related.map((r) => r.id)).toEqual(['yy']);
  });
});
