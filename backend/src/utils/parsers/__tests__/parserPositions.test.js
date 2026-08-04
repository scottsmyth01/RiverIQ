import { describe, expect, test } from '@jest/globals';
import { getPositions } from '../parser.js';

describe('getPositions', () => {
  test('assigns heads-up positions from the button seat', () => {
    const hand = getPositions({
      buttonSeat: 2,
      hero: { name: 'Hero' },
      players: [
        { seat: 1, name: 'Villain' },
        { seat: 2, name: 'Hero' },
      ],
    });

    expect(hand.players).toEqual([
      expect.objectContaining({ seat: 2, name: 'Hero', position: 'BTN' }),
      expect.objectContaining({ seat: 1, name: 'Villain', position: 'BB' }),
    ]);
    expect(hand.hero).toMatchObject({
      name: 'Hero',
      seat: 2,
      position: 'BTN',
    });
    expect(hand.heroPosition).toBe('BTN');
  });
});
