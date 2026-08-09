import { describe, expect, test } from '@jest/globals';
import { getAllInEV, getAllInWinPercentage, getAllInWinSampleSize } from '../getAllInEV.js';

const nonAllInWinningHand = {
  hero: {
    name: 'Hero',
    cards: ['As', 'Ah'],
  },
  preflop: {
    actions: [
      { player: 'Hero', action: 'raise', amount: 0.25, raiseTo: 0.3 },
      { player: 'Villain', action: 'call', amount: 0.3 },
    ],
  },
  flop: {
    actions: [{ player: 'Villain', action: 'fold' }],
  },
  summary: {
    totalPot: 0.75,
    seats: [{ player: 'Hero', result: 'won', amount: 0.75 }],
  },
};

const preflopAllInHand = {
  handNumber: '123456789',
  hero: {
    name: 'Hero',
    cards: ['As', 'Ah'],
  },
  preflop: {
    actions: [
      { player: 'Hero', action: 'raise', amount: 10, raiseTo: 10, allIn: true },
      { player: 'Villain', action: 'call', amount: 10, allIn: true },
    ],
  },
  flop: {
    board: ['Ad', '7c', '2h'],
    actions: [],
  },
  turn: {
    card: '4s',
    actions: [],
  },
  river: {
    card: '9d',
    actions: [],
  },
  showdown: {
    actions: [{ player: 'Villain', action: 'shows', cards: ['Kd', 'Kh'] }],
  },
  summary: {
    totalPot: 20,
    seats: [
      { player: 'Hero', result: 'won', amount: 20, cards: ['As', 'Ah'] },
      { player: 'Villain', result: 'lost', cards: ['Kd', 'Kh'] },
    ],
  },
};

describe('all-in EV stats', () => {
  test('does not count normal hand profit as all-in EV', () => {
    expect(getAllInEV([nonAllInWinningHand])).toBe(0);
    expect(getAllInWinPercentage([nonAllInWinningHand])).toBe(0);
    expect(getAllInWinSampleSize([nonAllInWinningHand])).toBe(0);
  });

  test('calculates all-in EV only for valid hero all-in hands', () => {
    expect(getAllInEV([nonAllInWinningHand, preflopAllInHand])).toBeGreaterThan(0);
    expect(getAllInWinPercentage([nonAllInWinningHand, preflopAllInHand])).toBeGreaterThan(0);
    expect(getAllInWinSampleSize([nonAllInWinningHand, preflopAllInHand])).toBe(1);
  });
});
