import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Once a store URL is set, the page shows the download button instead of "coming soon"
const STORE = 'https://play.google.com/store/apps/details?id=com.pradhyuman.flightline';
vi.mock('../../src/seo/flightline', async (importOriginal) => ({
  ...(await importOriginal()),
  DOWNLOAD: { url: 'https://play.google.com/store/apps/details?id=com.pradhyuman.flightline', label: 'Get it on Google Play' },
}));

const { default: Flightline } = await import('../../src/pages/Flightline');

describe('Flightline download', () => {
  it('links to the store when a URL is set', () => {
    render(
      <MemoryRouter>
        <Flightline />
      </MemoryRouter>
    );
    const cta = screen.getByRole('link', { name: 'Get it on Google Play' });
    expect(cta).toHaveAttribute('href', STORE);
    expect(cta).toHaveAttribute('target', '_blank');
    expect(screen.queryByText(/Coming soon/)).toBeNull();
  });
});
