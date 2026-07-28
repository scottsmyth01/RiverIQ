import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, test } from 'vitest';
import WebsiteFooter from '../WebsiteFooter';

describe('WebsiteFooter', () => {
  test('links to legal pages without showing FAQ', () => {
    render(
      <MemoryRouter>
        <WebsiteFooter />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Terms & Conditions' })).toHaveAttribute('href', '/terms');
    expect(screen.queryByRole('link', { name: 'FAQ' })).not.toBeInTheDocument();
  });
});
