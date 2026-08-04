import { describe, expect, test } from '@jest/globals';
import { getSteal } from '../getSteal.js';

const makeHand = ({ heroPosition = 'CO', actions }) => ({
  hero: {
    name: 'Hero',
    position: heroPosition,
  },
  players: [
    { name: 'UnderGun', position: 'UTG' },
    { name: 'Hijack', position: 'HJ' },
    { name: 'Hero', position: heroPosition },
    { name: 'Button', position: 'BTN' },
    { name: 'SmallBlind', position: 'SB' },
    { name: 'BigBlind', position: 'BB' },
  ],
  preflop: {
    actions,
  },
});

describe('getSteal', () => {
  test('ignores antes and blinds before counting late-position steal decisions', () => {
    const result = getSteal([
      makeHand({
        actions: [
          { player: 'UnderGun', action: 'post', blind: 'ante', amount: 0.08 },
          { player: 'Hijack', action: 'post', blind: 'ante', amount: 0.08 },
          { player: 'Hero', action: 'post', blind: 'ante', amount: 0.08 },
          { player: 'SmallBlind', action: 'post', blind: 'small', amount: 0.25 },
          { player: 'BigBlind', action: 'post', blind: 'big', amount: 0.5 },
          { player: 'UnderGun', action: 'fold' },
          { player: 'Hijack', action: 'fold' },
          { player: 'Hero', action: 'raise', amount: 1, raiseTo: 1.5 },
        ],
      }),
      makeHand({
        heroPosition: 'SB',
        actions: [
          { player: 'Hero', action: 'post', blind: 'ante', amount: 0.08 },
          { player: 'Hero', action: 'post', blind: 'small', amount: 0.25 },
          { player: 'BigBlind', action: 'post', blind: 'big', amount: 0.5 },
          { player: 'UnderGun', action: 'fold' },
          { player: 'Hijack', action: 'fold' },
          { player: 'Button', action: 'fold' },
          { player: 'Hero', action: 'fold' },
        ],
      }),
    ]);

    expect(result).toEqual({
      opportunities: 2,
      steals: 1,
      percentage: 50,
    });
  });

  test('ignores late-position hands after another player enters the pot', () => {
    const result = getSteal([
      makeHand({
        actions: [
          { player: 'UnderGun', action: 'call', amount: 0.5 },
          { player: 'Hero', action: 'raise', amount: 1, raiseTo: 1.5 },
        ],
      }),
    ]);

    expect(result).toEqual({
      opportunities: 0,
      steals: 0,
      percentage: 0,
    });
  });
});
