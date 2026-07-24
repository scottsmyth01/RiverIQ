import { describe, expect, test } from '@jest/globals';
import { getFoldToSteal } from '../getFoldToSteal.js';

const makeHand = ({ heroPosition = 'BB', actions }) => ({
  hero: {
    name: 'Hero',
    position: heroPosition,
  },
  players: [
    { name: 'Cutoff', position: 'CO' },
    { name: 'Button', position: 'BTN' },
    { name: 'SmallBlind', position: 'SB' },
    { name: 'Hero', position: heroPosition },
  ],
  preflop: {
    actions,
  },
});

describe('getFoldToSteal', () => {
  test('counts blind folds after a late-position unopened raise', () => {
    const result = getFoldToSteal([
      makeHand({
        actions: [
          { player: 'Cutoff', action: 'raise' },
          { player: 'Hero', action: 'fold' },
        ],
      }),
      makeHand({
        heroPosition: 'SB',
        actions: [
          { player: 'Button', action: 'raise' },
          { player: 'Hero', action: 'call' },
        ],
      }),
    ]);

    expect(result).toEqual({
      opportunities: 2,
      folds: 1,
      percentage: 50,
    });
  });

  test('ignores early-position raises and pots entered before the steal attempt', () => {
    const result = getFoldToSteal([
      makeHand({
        actions: [
          { player: 'UnderGun', action: 'raise' },
          { player: 'Hero', action: 'fold' },
        ],
      }),
      makeHand({
        actions: [
          { player: 'Cutoff', action: 'call' },
          { player: 'Button', action: 'raise' },
          { player: 'Hero', action: 'fold' },
        ],
      }),
      makeHand({
        heroPosition: 'BTN',
        actions: [
          { player: 'Cutoff', action: 'raise' },
          { player: 'Hero', action: 'fold' },
        ],
      }),
    ]);

    expect(result).toEqual({
      opportunities: 0,
      folds: 0,
      percentage: 0,
    });
  });
});
