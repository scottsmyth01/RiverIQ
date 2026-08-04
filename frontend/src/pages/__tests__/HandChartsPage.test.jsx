import { describe, expect, test, vi } from 'vitest';
import { screen } from '@testing-library/react';
import HandChartsPage from '../HandChartsPage';
import { renderWithRouter } from '../../test/testUtils.jsx';

vi.mock('../../hooks/useSessions', () => ({
  useSessions: vi.fn(),
}));

const { useSessions } = await import('../../hooks/useSessions');

describe('HandChartsPage', () => {
  test('shows 10,000-hand unlock progress for actual hand charts', () => {
    useSessions.mockReturnValue({
      data: [
        {
          tableSize: 6,
          hands: 250,
          stats: {
            handsPlayed: 250,
            handsByPosition: {},
          },
        },
        {
          tableSize: 9,
          hands: 4900,
          stats: {
            handsPlayed: 4900,
            handsByPosition: {},
          },
        },
      ],
    });

    renderWithRouter(<HandChartsPage />);

    expect(
      screen.getByText((content) =>
        content.includes('10,000 hands needed for hand chart') &&
        content.includes('250/10000 at 6max.'),
      ),
    ).toBeInTheDocument();
  });
});
