import { describe, expect, test, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '../Navbar';
import { renderWithRouter } from '../../../test/testUtils.jsx';

const updateBankroll = vi.fn();
const logout = vi.fn();

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      username: 'fletcherrr',
      bankroll: 125.5,
      preferences: {
        currency: 'USD',
      },
    },
    logout,
    updateBankroll,
    updateBankrollLoading: false,
  }),
}));

vi.mock('../../../hooks/useSessions', () => ({
  useSessions: () => ({
    data: [],
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Dashboard Navbar', () => {
  test('shows bankroll and submits a deposit', async () => {
    renderWithRouter(<Navbar />);

    expect(screen.getByText('$125.50')).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Deposit or withdraw bankroll'));
    await userEvent.type(screen.getByLabelText('Amount'), '50');
    await userEvent.click(screen.getByRole('button', { name: 'Add Funds' }));

    expect(updateBankroll).toHaveBeenCalledWith({
      action: 'deposit',
      amount: '50',
    });
  });
});
