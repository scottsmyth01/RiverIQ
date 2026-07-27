import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { parse888Poker } from '../888poker/wrapper.js';
import { parseCoinPoker } from '../coinpoker/wrapper.js';
import { parseGGPoker } from '../ggpoker/wrapper.js';
import { parsePartyPoker } from '../partypoker/wrapper.js';
import { parsePokerStars } from '../pokerstars/wrapper.js';
import { calculateStats } from '../stats/calculateStats.js';

const fixtureCases = [
  {
    site: 'PokerStars',
    parse: parsePokerStars,
    files: [
      'src/utils/parsers/fixtures/ps/pokerstars_250_hand_winning_session_01.txt',
      'src/utils/parsers/fixtures/ps/pokerstars_250_hand_losing_session_02.txt',
      'src/utils/parsers/fixtures/ps/pokerstars_250_hand_mixed_session_03.txt',
      'src/utils/parsers/fixtures/ps/pokerstars_250_hand_high_variance_session_04.txt',
      'src/utils/parsers/fixtures/ps/pokerstars_250_hand_edge_session.txt',
    ],
  },
  {
    site: 'CoinPoker',
    parse: parseCoinPoker,
    files: ['src/utils/parsers/fixtures/coinpoker/coinpoker_single_hand.txt'],
    handCount: 1,
    positions: ['BTN'],
  },
  {
    site: 'GGPoker',
    parse: parseGGPoker,
    files: [
      'src/utils/parsers/fixtures/gg/ggpoker_250_hand_winning_session_01.txt',
      'src/utils/parsers/fixtures/gg/ggpoker_250_hand_losing_session_02.txt',
      'src/utils/parsers/fixtures/gg/ggpoker_250_hand_mixed_session_03.txt',
      'src/utils/parsers/fixtures/gg/ggpoker_250_hand_high_variance_session_04.txt',
      'src/utils/parsers/fixtures/gg/ggpoker_250_hand_edge_session_05.txt',
    ],
  },
  {
    site: '888poker',
    parse: parse888Poker,
    files: [
      'src/utils/parsers/fixtures/888/888poker_250_hand_winning_session_01.txt',
      'src/utils/parsers/fixtures/888/888poker_250_hand_losing_session_02.txt',
      'src/utils/parsers/fixtures/888/888poker_250_hand_mixed_session_03.txt',
      'src/utils/parsers/fixtures/888/888poker_250_hand_high_variance_session_04.txt',
      'src/utils/parsers/fixtures/888/888poker_250_hand_edge_session_05.txt',
    ],
  },
  {
    site: 'partypoker',
    parse: parsePartyPoker,
    files: [
      'src/utils/parsers/fixtures/pp/partypoker_250_hand_winning_session_01.txt',
      'src/utils/parsers/fixtures/pp/partypoker_250_hand_losing_session_02.txt',
      'src/utils/parsers/fixtures/pp/partypoker_250_hand_mixed_session_03.txt',
      'src/utils/parsers/fixtures/pp/partypoker_250_hand_high_variance_session_04.txt',
      'src/utils/parsers/fixtures/pp/partypoker_250_hand_edge_session.txt',
    ],
  },
];

const statKeys = [
  'handsPlayed',
  'profit',
  'allInEV',
  'bb100',
  'vpip',
  'pfr',
  'threeBet',
  'foldToThreeBet',
  'fourBet',
  'foldToFourBet',
  'steal',
  'foldToSteal',
  'cBet',
  'foldToCBet',
  'turnCBet',
  'foldToTurnCBet',
  'wtsd',
  'wsd',
  'aggressionFactor',
];

describe('parser fixtures', () => {
  test.each(fixtureCases)('$site parser handles empty and unsupported files', ({ parse }) => {
    expect(parse('')).toEqual([]);
    expect(parse('this is not a supported hand history')).toEqual([]);
  });

  for (const { site, parse, files, handCount = 250, positions = ['BB', 'BTN', 'CO', 'HJ', 'SB', 'UTG'] } of fixtureCases) {
    test.each(files)(`${site} parses %s and calculates complete stats`, (filePath) => {
      const fileText = readFileSync(filePath, 'utf8');
      const hands = parse(fileText);
      const stats = calculateStats(hands);

      expect(hands).toHaveLength(handCount);
      expect(stats.handsPlayed).toBe(handCount);
      expect(Object.keys(stats.byPosition).sort()).toEqual(positions);
      expect(Object.keys(stats.handsByPosition).sort()).toEqual(positions);

      for (const hand of hands) {
        expect(hand).toBeTruthy();
        expect(hand.handNumber).toBeTruthy();
        expect(hand.date).toBeTruthy();
        expect(hand.hero?.name).toBeTruthy();
        expect(hand.hero?.position).toBeTruthy();
        expect(hand.hero?.cards).toHaveLength(2);
        expect(hand.table?.smallBlind).toBeGreaterThan(0);
        expect(hand.table?.bigBlind).toBeGreaterThan(0);
      }

      for (const key of statKeys) {
        expect(Number.isFinite(stats[key])).toBe(true);
      }
    });
  }
});
