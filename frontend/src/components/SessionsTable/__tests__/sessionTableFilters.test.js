import { describe, expect, test } from 'vitest';
import { applySorting } from '../sessionTableFilters';

describe('sessionTableFilters', () => {
  test('sorts sessions from the same day by newest added first', () => {
    const sessions = [
      {
        _id: 'older-upload',
        date: '2026-07-31T09:00:00.000Z',
        createdAt: '2026-07-31T15:00:00.000Z',
      },
      {
        _id: 'newer-upload',
        date: '2026-07-31T09:00:00.000Z',
        createdAt: '2026-07-31T18:00:00.000Z',
      },
      {
        _id: 'previous-day',
        date: '2026-07-30T23:00:00.000Z',
        createdAt: '2026-07-31T20:00:00.000Z',
      },
    ];

    expect(applySorting('newest', sessions).map((session) => session._id)).toEqual([
      'newer-upload',
      'older-upload',
      'previous-day',
    ]);
  });
});
