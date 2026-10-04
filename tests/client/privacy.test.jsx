import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Privacy from '../../src/pages/Privacy';
import { APPS, SECTIONS, APP_FIELDS, CONTACT_EMAIL } from '../../src/seo/privacy';

describe('Privacy policy page', () => {
  it('shows every general section, every app and a contact link', () => {
    const { container } = render(
      <MemoryRouter>
        <Privacy />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument();
    for (const s of SECTIONS) expect(screen.getByRole('heading', { level: 2, name: s.heading })).toBeInTheDocument();
    for (const app of APPS) {
      // Store listings link to /privacy#<id>
      const entry = container.querySelector(`#${app.id}`);
      expect(entry).not.toBeNull();
      expect(within(entry).getByRole('heading', { level: 3, name: app.name })).toBeInTheDocument();
      for (const [key, label] of APP_FIELDS) {
        expect(within(entry).getByText(label)).toBeInTheDocument();
        expect(within(entry).getByText(app[key])).toBeInTheDocument();
      }
    }
    expect(screen.getByRole('link', { name: CONTACT_EMAIL })).toHaveAttribute('href', `mailto:${CONTACT_EMAIL}`);
  });
});

describe('Privacy policy data', () => {
  it('gives every app a unique URL-safe id and fills every field', () => {
    const ids = APPS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const app of APPS) {
      expect(app.id).toMatch(/^[a-z0-9-]+$/);
      for (const [key] of APP_FIELDS) expect(app[key], `${app.id}.${key}`).toBeTruthy();
    }
  });

  it('follows the house style (no em or en dashes)', () => {
    const text = JSON.stringify({ APPS, SECTIONS });
    expect(text).not.toMatch(/[–—]/);
  });
});
