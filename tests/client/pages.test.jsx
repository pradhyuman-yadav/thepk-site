import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { rawArticles } from '../fixtures/articles.js';

vi.mock('../../src/services/squidexClient', async (importOriginal) => ({
  ...(await importOriginal()),
  fetchSquidexArticles: vi.fn(async () => rawArticles),
}));

const { fetchSquidexArticles } = await import('../../src/services/squidexClient');
const { resetArticlesCache } = await import('../../src/hooks/useArticles');
const { ThemeProvider } = await import('../../src/contexts/ThemeContext');
const { default: Home } = await import('../../src/pages/Home');
const { default: Articles } = await import('../../src/pages/Articles');
const { default: SingleArticle } = await import('../../src/pages/SingleArticle');
const { default: NotFound } = await import('../../src/pages/NotFound');
const { default: Navigation } = await import('../../src/components/Navigation');
const { default: Layout } = await import('../../src/components/Layout');
const { processArticleList } = await import('../../src/utils/richTextConverter');

const renderAt = (path, element, routePath = '*') =>
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={routePath} element={element} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

beforeEach(() => {
  resetArticlesCache();
  fetchSquidexArticles.mockClear();
  fetchSquidexArticles.mockImplementation(async () => rawArticles);
});

describe('Navigation', () => {
  it('shows the seven public links in order and marks the current page', () => {
    renderAt('/articles?topic=openai', <Navigation />);
    const links = screen.getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['Home', 'Articles', 'Tools', 'About Me', 'AI Chat (SLM)', 'Pipeline', 'DC Metro']);
    expect(screen.getByRole('link', { name: 'Articles' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('keeps Articles active on an article page', () => {
    renderAt('/article/a-openai', <Navigation />);
    expect(screen.getByRole('link', { name: 'Articles' })).toHaveAttribute('aria-current', 'page');
  });
});

describe('Layout', () => {
  it('renders the decorative backdrop layer and marks real content for the fill to avoid', () => {
    const { container } = renderAt('/', <Layout><p>content</p></Layout>);
    const layer = container.querySelector('.backdrop-layer');
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('[data-backdrop-avoid]')).toHaveLength(2);
    expect(container.querySelector('.site-ribbon nav')).not.toBeNull();
    expect(container.querySelector('.hamburger-menu')).toBeNull();
    expect(screen.getByText('Pradhyuman Yadav').tagName).toBe('P');
  });
});

describe('Home', () => {
  it('leads with the newest article, then six more and the topic index', async () => {
    renderAt('/', <Home />);
    expect(screen.getByRole('heading', { level: 1, name: 'Daily AI news briefs' })).toBeInTheDocument();
    const lead = await screen.findByRole('link', { name: 'OpenAI launches a new reasoning model' });
    expect(lead).toHaveAttribute('href', '/article/a-openai');
    expect(screen.getByRole('link', { name: 'Read article' })).toHaveAttribute('href', '/article/a-openai');
    const more = screen.getByRole('heading', { name: 'More articles' }).closest('section');
    expect(within(more).getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByRole('link', { name: `All articles (${rawArticles.length})` })).toHaveAttribute('href', '/articles');
    expect(screen.getByRole('navigation', { name: 'Article topics' })).toBeInTheDocument();
  });

  it('renders immediately from server-inlined data without waiting for the CMS', () => {
    window.__INITIAL_ARTICLES__ = processArticleList(rawArticles).map((a) => ({ ...a, content: undefined }));
    fetchSquidexArticles.mockImplementation(() => new Promise(() => {}));
    renderAt('/', <Home />);
    expect(screen.getByRole('link', { name: 'OpenAI launches a new reasoning model' })).toBeInTheDocument();
  });

  it('shows an error message when articles cannot load', async () => {
    fetchSquidexArticles.mockRejectedValue(new Error('down'));
    renderAt('/', <Home />);
    expect(await screen.findByText(/could not be loaded/)).toBeInTheDocument();
  });
});

describe('Articles', () => {
  it('lists every article as a real link', async () => {
    renderAt('/articles', <Articles />);
    await screen.findByRole('link', { name: 'OpenAI launches a new reasoning model' });
    expect(screen.getByText(`${rawArticles.length} articles`)).toBeInTheDocument();
    for (const a of rawArticles) {
      expect(screen.getByRole('link', { name: a.data.title.iv.replace(/\s*—\s*/, ' - ') })).toHaveAttribute('href', `/article/${a.id}`);
    }
  });

  it('filters by topic from the URL', async () => {
    renderAt('/articles?topic=openai', <Articles />);
    expect(await screen.findByRole('heading', { level: 1, name: 'OpenAI articles' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'OpenAI launches a new reasoning model' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Meta debuts its Muse AI agent' })).toBeNull();
    expect(document.title).toBe('OpenAI AI News | Pradhyuman Yadav');
  });

  it('shows an empty state for a topic with no articles', async () => {
    renderAt('/articles?topic=bogus', <Articles />);
    expect(await screen.findByText(/No articles in this topic yet/)).toBeInTheDocument();
  });

  it('pages long lists with a Show more button', async () => {
    const many = Array.from({ length: 45 }, (_, i) => ({
      ...rawArticles[0],
      id: `bulk-${i}`,
      created: `2026-08-${String((i % 28) + 1).padStart(2, '0')}T06:00:00Z`,
      lastModified: `2026-08-${String((i % 28) + 1).padStart(2, '0')}T06:00:00Z`,
      data: { ...rawArticles[0].data, title: { iv: `Bulk story ${i}` } },
    }));
    fetchSquidexArticles.mockResolvedValue(many);
    const { container } = renderAt('/articles', <Articles />);
    await screen.findByText('45 articles');
    expect(container.querySelectorAll('.article-card')).toHaveLength(20);
    fireEvent.click(screen.getByRole('button', { name: 'Show 20 more' }));
    expect(container.querySelectorAll('.article-card')).toHaveLength(40);
    fireEvent.click(screen.getByRole('button', { name: 'Show 5 more' }));
    expect(container.querySelectorAll('.article-card')).toHaveLength(45);
    expect(screen.queryByRole('button', { name: /Show \d+ more/ })).toBeNull();
  });
});

describe('SingleArticle', () => {
  it('renders the article with breadcrumb, byline, categories and SEO title', async () => {
    renderAt('/article/a-anthropic', <SingleArticle />, '/article/:id');
    expect(await screen.findByRole('heading', { level: 1, name: 'Anthropic is operating a lab that conducts biology experiments' })).toBeInTheDocument();
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(crumbs).getByRole('link', { name: 'Articles' })).toHaveAttribute('href', '/articles');
    expect(screen.getByText('Anthropic operates a wet lab.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Anthropic' })).toHaveAttribute('href', '/articles?topic=anthropic');
    expect(document.title).toBe('Anthropic is operating a lab that conducts biology experiments | Pradhyuman Yadav');
    expect(document.querySelector('link[rel="canonical"]').href).toBe('https://thepk.in/article/a-anthropic');
  });

  it('keeps the same body nodes when the full list replaces the inlined one', async () => {
    window.__INITIAL_ARTICLES__ = processArticleList(rawArticles);
    let resolve;
    fetchSquidexArticles.mockImplementation(() => new Promise((r) => (resolve = r)));
    const { container } = renderAt('/article/a-anthropic', <SingleArticle />, '/article/:id');
    const firstParagraph = container.querySelector('.art-body p');
    expect(firstParagraph).not.toBeNull();
    resolve(rawArticles);
    await waitFor(() => expect(fetchSquidexArticles).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));
    // Re-setting innerHTML would replace the node (and re-trigger the word wipe and LCP)
    expect(container.querySelector('.art-body p')).toBe(firstParagraph);
  });

  it('waits for the body when only the inlined list is available', () => {
    window.__INITIAL_ARTICLES__ = processArticleList(rawArticles).map((a) => ({ ...a, content: undefined }));
    fetchSquidexArticles.mockImplementation(() => new Promise(() => {}));
    const { container } = renderAt('/article/a-anthropic', <SingleArticle />, '/article/:id');
    expect(container.querySelector('.skeleton')).not.toBeNull();
    expect(screen.queryByText('This article does not exist or was removed.', { exact: false })).toBeNull();
  });

  it('says so when the article does not exist', async () => {
    renderAt('/article/missing', <SingleArticle />, '/article/:id');
    expect(await screen.findByText(/does not exist or was removed/)).toBeInTheDocument();
  });
});

describe('NotFound', () => {
  it('offers a way back and sets the title', () => {
    renderAt('/nope', <NotFound />);
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse all articles' })).toHaveAttribute('href', '/articles');
    expect(document.title).toBe('Page not found | Pradhyuman Yadav');
  });
});

describe('useArticles', () => {
  it('fetches the CMS once and shares the result between pages', async () => {
    renderAt('/', <Home />);
    await screen.findByRole('link', { name: 'Read article' });
    renderAt('/articles', <Articles />);
    await waitFor(() => expect(fetchSquidexArticles).toHaveBeenCalledTimes(1));
  });
});
