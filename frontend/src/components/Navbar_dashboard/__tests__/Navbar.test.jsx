import { describe, expect, test, vi } from 'vitest';
import { screen } from '@testing-library/react';
import Navbar from '../Navbar';
import { renderWithRouter } from '../../../test/testUtils.jsx';

const logout = vi.fn();

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      username: 'fletcherrr',
      bankroll: 262.5,
      preferences: {
        currency: 'USD',
      },
    },
    logout,
    updateBankroll: vi.fn(),
    updateBankrollLoading: false,
  }),
}));

vi.mock('../../../hooks/useSessions', () => ({
  useSessions: () => ({
    data: [],
  }),
}));

describe('Dashboard Navbar', () => {
  test('shows primary dashboard actions with bankroll controls', () => {
    renderWithRouter(<Navbar />);

    expect(screen.getByRole('link', { name: 'RiverIQ dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add new session' })).toBeInTheDocument();
    expect(screen.getByText('$262.50')).toBeInTheDocument();
    expect(screen.getByLabelText('Deposit or withdraw bankroll')).toBeInTheDocument();
  });
});
