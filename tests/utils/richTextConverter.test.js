// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  convertRichTextToHTML,
  normalizeDashes,
  htmlToPlainText,
  truncateWords,
  processArticleData,
  processArticleList,
} from '../../src/utils/richTextConverter.js';
import { rawArticles } from '../fixtures/articles.js';

describe('convertRichTextToHTML', () => {
  it('converts paragraphs, marks, headings, lists, code and links', () => {
    const html = convertRichTextToHTML({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Title' }] },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' and ' },
            { type: 'text', text: 'link', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] },
          ],
        },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }] }] },
        { type: 'codeBlock', attrs: { language: 'js' }, content: [{ type: 'text', text: 'x()' }] },
      ],
    });
    expect(html).toContain('<h2>Title</h2>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<a href="https://example.com" target="_blank" rel="noopener noreferrer">link</a>');
    expect(html).toContain('<ul><li><p>one</p></li></ul>');
    expect(html).toContain('<pre><code class="language-js">x()</code></pre>');
  });

  it('accepts strings, localized wrappers and empty input', () => {
    expect(convertRichTextToHTML('<p>x</p>')).toBe('<p>x</p>');
    expect(convertRichTextToHTML({ iv: '<p>y</p>' })).toBe('<p>y</p>');
    expect(convertRichTextToHTML(null)).toBe('');
  });
});

describe('text helpers', () => {
  it('replaces em, en and horizontal-bar dashes with hyphens', () => {
    expect(normalizeDashes('AI — and more')).toBe('AI - and more');
    expect(normalizeDashes('2018–2026')).toBe('2018-2026');
    expect(normalizeDashes('a―b')).toBe('a - b');
    expect(normalizeDashes(undefined)).toBeUndefined();
  });

  it('strips tags and decodes common entities', () => {
    expect(htmlToPlainText('<p>A &amp; B</p><p>C&nbsp;D &lt;tag&gt; &quot;q&quot; &#39;s</p>')).toBe('A & B C D <tag> "q" \'s');
  });

  it('truncates on word boundaries without doubled punctuation', () => {
    expect(truncateWords('one two three', 5)).toBe('one two three');
    expect(truncateWords('one two. three four', 2)).toBe('one two...');
  });
});

describe('processArticleData', () => {
  const byId = Object.fromEntries(rawArticles.map((r) => [r.id, processArticleData(r)]));

  it('maps the Squidex fields', () => {
    const a = byId['a-openai'];
    expect(a).toMatchObject({ id: 'a-openai', title: 'OpenAI launches a new reasoning model', author: 'Pradhyuman' });
    expect(a.content).toContain('<p>OpenAI released');
    expect(a.readingTime).toBe(1);
    expect(a.categories.map((c) => c.slug)).toContain('openai');
  });

  it('removes em and en dashes from titles and bodies', () => {
    const a = byId['a-dash'];
    expect(a.title).not.toMatch(/[–—]/);
    expect(a.content).not.toMatch(/[–—]/);
    expect(a.content).toContain('2018-2026');
  });

  it('uses the excerpt as summary when present, otherwise the opening text', () => {
    expect(byId['a-excerpt'].summary).toBe('A short excerpt written by the editor.');
    expect(byId['a-openai'].summary.startsWith('OpenAI released a model')).toBe(true);
  });

  it('honours CMS tags', () => {
    expect(byId['a-tags'].categories.map((c) => c.slug)).toEqual(['policy-safety', 'custom-tag']);
  });

  it('sorts lists newest first', () => {
    const list = processArticleList([...rawArticles].reverse());
    const dates = list.map((a) => new Date(a.publishDate).getTime());
    expect(dates).toEqual([...dates].sort((x, y) => y - x));
    expect(list[0].id).toBe('a-openai');
  });
});
