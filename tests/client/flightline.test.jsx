import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { rawArticles } from '../fixtures/articles.js';

vi.mock('../../src/services/squidexClient', async (importOriginal) => ({
  ...(await importOriginal()),
  fetchSquidexArticles: vi.fn(async () => rawArticles),
}));

const { default: Flightline } = await import('../../src/pages/Flightline');
const { default: Tools } = await import('../../src/pages/Tools');
const { default: App } = await import('../../src/App');
const { FLIGHTLINE, ZONES, UPGRADES, PROGRESSION, FACTS } = await import('../../src/seo/flightline');
const { SKINS, applySkin, skinFor } = await import('../../src/utils/skins');
const { buildVocabulary } = await import('../../src/utils/backdropDom');
const { processArticleList } = await import('../../src/utils/richTextConverter');

const renderPage = (el) => render(<MemoryRouter>{el}</MemoryRouter>);

describe('Flightline page', () => {
  it('shows the logo, tagline, facts, zones, hangar and progression', () => {
    renderPage(<Flightline />);
    expect(screen.getByRole('heading', { level: 1, name: 'Flightline' })).toBeInTheDocument();
    expect(screen.getByAltText('Flightline app icon')).toHaveAttribute('src', FLIGHTLINE.icon);
    expect(screen.getByAltText(/feature graphic/)).toHaveAttribute('src', FLIGHTLINE.feature);
    expect(screen.getByText(FLIGHTLINE.tagline)).toBeInTheDocument();
    for (const f of FACTS) expect(screen.getByText(f.label)).toBeInTheDocument();

    const zones = screen.getByRole('heading', { name: 'Six zones' }).closest('section');
    expect(within(zones).getAllByRole('listitem')).toHaveLength(ZONES.length);
    for (const z of ZONES) expect(within(zones).getByText(z.gate)).toBeInTheDocument();
    for (const u of UPGRADES) expect(screen.getByText(u.name)).toBeInTheDocument();
    for (const p of PROGRESSION) expect(screen.getByText(p.name)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy policy' })).toHaveAttribute('href', '/privacy#flightline');
  });

  it('says the download is coming soon until a store URL is set', () => {
    renderPage(<Flightline />);
    expect(screen.getByText(/Coming soon to Android/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Get it on Google Play' })).toBeNull();
  });

  it('is reachable from the Tools projects list', () => {
    renderPage(<Tools />);
    expect(screen.getByRole('link', { name: /Read more/ })).toHaveAttribute('href', '/flightline');
  });

  it('has facts that match the Unity project (six zones, five upgrades)', () => {
    expect(ZONES.map((z) => z.gate)).toEqual(['A1', 'B2', 'C3', 'D4', 'E5', 'F6']);
    expect(UPGRADES).toHaveLength(5);
    expect(JSON.stringify({ FLIGHTLINE, ZONES, UPGRADES, PROGRESSION, FACTS })).not.toMatch(/[–—]/);
  });
});

describe('page skins', () => {
  it('sets and clears the skin attribute', () => {
    applySkin('/flightline');
    expect(document.documentElement.getAttribute('data-skin')).toBe('flightline');
    applySkin('/articles');
    expect(document.documentElement.hasAttribute('data-skin')).toBe(false);
    expect(skinFor('/flightline')).toBe('flightline');
    expect(skinFor('/')).toBeNull();
  });

  it('keeps the pre-paint script in index.html in sync with SKINS', () => {
    // Vitest runs from the project root; import.meta.url is not a file URL under jsdom
    const html = readFileSync('index.html', 'utf8');
    for (const [path, skin] of Object.entries(SKINS)) {
      expect(html).toContain(`location.pathname === '${path}'`);
      expect(html).toContain(`'data-skin', '${skin}'`);
    }
  });

  it('applies the Flightline skin when the app shows /flightline, and no skin elsewhere', async () => {
    window.history.pushState({}, '', '/flightline');
    const { unmount } = render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Flightline' })).toBeInTheDocument();
    expect(document.documentElement.getAttribute('data-skin')).toBe('flightline');
    unmount();

    window.history.pushState({}, '', '/');
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Daily AI news briefs' })).toBeInTheDocument();
    expect(document.documentElement.hasAttribute('data-skin')).toBe(false);
  });
});

describe('background type follows the skin', () => {
  it('builds fonts from the faces object at use time', () => {
    const faces = { display: 'Display A', serif: 'Serif A', mono: 'Mono A' };
    const vocab = buildVocabulary(processArticleList(rawArticles), faces);
    expect(vocab.map((w) => w.font(24)).join('|')).toContain('Display A');
    Object.assign(faces, { display: 'Barlow Condensed', serif: 'B612', mono: 'B612 Mono' });
    const after = vocab.map((w) => w.font(24)).join('|');
    expect(after).toContain('Barlow Condensed');
    expect(after).not.toContain('Display A');
  });
});
