import { describe, expect, test, vi } from 'vitest';
import { screen } from '@testing-library/react';
import Navbar from '../Navbar';
import { renderWithRouter } from '../../../test/testUtils.jsx';

const logout = vi.fn();

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      username: 'fletcherrr',
      preferences: {
        currency: 'USD',
      },
    },
    logout,
  }),
}));

vi.mock('../../../hooks/useSessions', () => ({
  useSessions: () => ({
    data: [],
  }),
}));

describe('Dashboard Navbar', () => {
  test('shows primary dashboard actions without bankroll controls', () => {
    renderWithRouter(<Navbar />);

    expect(screen.getByRole('link', { name: 'RiverIQ dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add new session' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Deposit or withdraw bankroll')).not.toBeInTheDocument();
  });
});
