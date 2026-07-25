import { describe, expect, test, vi } from 'vitest';
import { screen } from '@testing-library/react';
import HandChartsPage from '../HandChartsPage';
import { renderWithRouter } from '../../test/testUtils.jsx';

vi.mock('../../hooks/useSessions', () => ({
  useSessions: vi.fn(),
}));

const { useSessions } = await import('../../hooks/useSessions');

describe('HandChartsPage', () => {
  test('shows 5,000-hand unlock progress for actual hand charts', () => {
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
      ],
    });

    renderWithRouter(<HandChartsPage />);

    expect(screen.getByText('250 / 5,000 hands uploaded')).toBeInTheDocument();
    expect(screen.getByText('Upload 4,750 more hands to reveal this section.')).toBeInTheDocument();
  });
});
