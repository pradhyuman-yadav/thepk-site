import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { rawArticles } from '../fixtures/articles.js';

vi.mock('../../src/services/squidexClient', async (importOriginal) => ({
  ...(await importOriginal()),
  fetchSquidexArticles: vi.fn(async () => rawArticles),
}));

const { ThemeProvider } = await import('../../src/contexts/ThemeContext');
const { default: DarkModeToggle } = await import('../../src/components/DarkModeToggle');
const { default: App } = await import('../../src/App');

const withDarkSystem = (dark) => {
  const original = window.matchMedia;
  window.matchMedia = (q) => ({ ...original(q), matches: dark && q.includes('dark') });
  return () => {
    window.matchMedia = original;
  };
};

describe('theme', () => {
  it('follows the system setting until the visitor chooses, then remembers the choice', () => {
    const restore = withDarkSystem(true);
    render(
      <ThemeProvider>
        <DarkModeToggle />
      </ThemeProvider>
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('darkMode')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('darkMode')).toBe('false');
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument();
    restore();
  });

  it('uses a saved preference over the system setting', () => {
    localStorage.setItem('darkMode', 'true');
    const restore = withDarkSystem(false);
    render(
      <ThemeProvider>
        <DarkModeToggle />
      </ThemeProvider>
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    restore();
  });
});

describe('App', () => {
  it('boots at / with the section links, nameplate and home headline', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByText('Pradhyuman Yadav', { selector: 'p' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: 'Daily AI news briefs' })).toBeInTheDocument();
    expect(document.title).toBe('Pradhyuman Yadav: AI/Software Engineer');
  });

  it('routes unknown paths to the not-found page', async () => {
    window.history.pushState({}, '', '/definitely-not-a-page');
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
  });
});
