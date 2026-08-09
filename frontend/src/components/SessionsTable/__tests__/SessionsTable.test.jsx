import { describe, expect, test, vi } from 'vitest';
import { Route } from 'react-router';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SessionsTable from '../SessionsTable';
import { renderWithRouter } from '../../../test/testUtils.jsx';

vi.mock('../../../hooks/useSessions', () => ({
  useDeleteSession: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const { useAuth } = await import('../../../hooks/useAuth');

const session = {
  _id: 'session-1',
  sessionName: 'Sunday session',
  date: '2026-07-22T12:00:00.000Z',
  game: 'NL Holdem',
  stakes: '$0.05/$0.10',
  profit: 14.75,
  bb100: 59,
  duration: 71,
  hands: 250,
};

function renderSessionsTable(subscription = 'free', sessions = [session]) {
  useAuth.mockReturnValue({
    user: {
      subscription,
      preferences: {
        defaultTimeFilter: 'all',
      },
    },
  });

  renderWithRouter(null, {
    initialEntries: ['/dashboard/sessions'],
    routes: (
      <>
        <Route path='/dashboard/sessions' element={<SessionsTable sessions={sessions} variant='sessions-page' />} />
        <Route path='/subscription/payment' element={<div>Payment page</div>} />
        <Route path='/dashboard/sessions/:id/stats' element={<div>Session stats page</div>} />
      </>
    ),
  });
}

describe('SessionsTable', () => {
  test('sends free users to payment when they click locked stats', async () => {
    renderSessionsTable('free');

    await userEvent.click(screen.getByLabelText('Stats are locked. Upgrade to Pro to view stats.'));

    expect(screen.getByText('Payment page')).toBeInTheDocument();
  });

  test('sends pro users to session stats', async () => {
    renderSessionsTable('pro');

    await userEvent.click(screen.getByLabelText('View stats for Sunday session'));

    expect(screen.getByText('Session stats page')).toBeInTheDocument();
  });

  test('omits zero ante from displayed stakes', () => {
    renderSessionsTable('pro', [
      {
        ...session,
        stakes: '$0.05/$0.10 ($0.00)',
      },
    ]);

    expect(screen.getByText('$0.05/$0.10')).toBeInTheDocument();
    expect(screen.queryByText(/\$0\.00/)).not.toBeInTheDocument();
  });
});
