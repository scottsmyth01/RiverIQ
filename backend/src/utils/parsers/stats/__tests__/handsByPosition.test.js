import { describe, expect, test } from '@jest/globals';
import { getHandsByPosition, getStartingHand } from '../getHandsByPosition.js';

const makeHand = ({ cards, position = 'UTG', actions = [] }) => ({
  hero: {
    name: 'Hero',
    position,
    cards,
  },
  preflop: {
    actions,
  },
});

describe('getStartingHand', () => {
  test('normalizes pairs, suited hands, offsuit hands, and card order', () => {
    expect(getStartingHand(['Ah', 'Ad'])).toBe('AA');
    expect(getStartingHand(['2c', 'As'])).toBe('A2o');
    expect(getStartingHand(['Ts', 'Js'])).toBe('JTs');
  });

  test('returns null for missing or invalid hole cards', () => {
    expect(getStartingHand([])).toBeNull();
    expect(getStartingHand(['Ah'])).toBeNull();
    expect(getStartingHand(['Ah', 'BadCard'])).toBeNull();
  });
});

describe('getHandsByPosition', () => {
  test('counts open raises, calls facing raises, and folds by starting hand', () => {
    const result = getHandsByPosition([
      makeHand({
        cards: ['Ah', 'Ad'],
        position: 'UTG',
        actions: [{ player: 'Hero', action: 'raise' }],
      }),
      makeHand({
        cards: ['Kc', 'Qd'],
        position: 'BTN',
        actions: [
          { player: 'Villain', action: 'raise' },
          { player: 'Hero', action: 'call' },
        ],
      }),
      makeHand({
        cards: ['7h', '2c'],
        position: 'BB',
        actions: [
          { player: 'Villain', action: 'raise' },
          { player: 'Hero', action: 'fold' },
        ],
      }),
      makeHand({
        cards: ['As'],
        position: 'SB',
        actions: [{ player: 'Hero', action: 'fold' }],
      }),
    ]);

    expect(result.UTG.AA).toMatchObject({
      dealt: 1,
      played: 1,
      openRaised: 1,
      raised: 1,
      folded: 0,
    });
    expect(result.BTN.KQo).toMatchObject({
      dealt: 1,
      played: 1,
      called: 1,
      limped: 0,
      openRaised: 0,
      folded: 0,
    });
    expect(result.BB['72o']).toMatchObject({
      dealt: 1,
      played: 0,
      folded: 1,
    });
    expect(result.SB).toBeUndefined();
  });
});
