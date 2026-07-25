import { describe, expect, test, vi } from 'vitest';
import { Route } from 'react-router';
import { screen } from '@testing-library/react';
import ProtectedRoute from '../ProtectedRoute';
import { renderWithRouter } from '../../test/testUtils.jsx';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const { useAuth } = await import('../../hooks/useAuth');

function renderProtectedRoute() {
  renderWithRouter(null, {
    initialEntries: ['/dashboard'],
    routes: (
      <>
        <Route
          path='/dashboard'
          element={
            <ProtectedRoute>
              <div>Private dashboard</div>
            </ProtectedRoute>
          }
        />
        <Route path='/login' element={<div>Login page</div>} />
      </>
    ),
  });
}

describe('ProtectedRoute', () => {
  test('shows protected content when authenticated', () => {
    useAuth.mockReturnValue({ user: { username: 'hero' }, loading: false });

    renderProtectedRoute();

    expect(screen.getByText('Private dashboard')).toBeInTheDocument();
  });

  test('redirects logged-out users to login', () => {
    useAuth.mockReturnValue({ user: null, loading: false });

    renderProtectedRoute();

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  test('shows the loader while auth is loading', () => {
    useAuth.mockReturnValue({ user: null, loading: true });

    renderProtectedRoute();

    expect(screen.getByRole('dialog', { name: 'Loading' })).toBeInTheDocument();
  });
});
