import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { parse888Poker } from '../888poker/wrapper.js';
import { parseCoinPoker } from '../coinpoker/wrapper.js';
import { parseFanDuel } from '../fanduel/wrapper.js';
import { parseGGPoker } from '../ggpoker/wrapper.js';
import { parsePartyPoker } from '../partypoker/wrapper.js';
import { parsePokerStars } from '../pokerstars/wrapper.js';
import { calculateStats } from '../stats/calculateStats.js';
import { getHandProfit } from '../stats/getProfit.js';

const cashEdgeCaseExpectations = {
  handsPlayed: 8,
  profit: 11.25,
  allInWinSampleSize: 3,
  allInWinPercentage: 37,
  hands: [
    { handNumber: '990000001', profit: 10, heroPosition: 'BTN', result: 'won', allIn: true },
    { handNumber: '990000002', profit: -10, heroPosition: 'CO', result: 'lost', allIn: true },
    { handNumber: '990000003', profit: 0.45, heroPosition: 'HJ', result: 'collected', hasUncalledBetReturn: true },
    { handNumber: '990000004', profit: 0.3, heroPosition: 'BTN', tableSize: 2 },
    {
      handNumber: '990000005',
      profit: 10,
      heroPosition: 'UTG',
      allIn: true,
      pots: [
        { type: 'main pot', amount: 15 },
        { type: 'side pot', amount: 10 },
      ],
    },
    { handNumber: '990000006', profit: 0, heroPosition: 'BB', result: 'collected' },
    { handNumber: '990000007', profit: 0.05, heroPosition: 'SB', result: 'collected' },
    { handNumber: '990000008', profit: 0.45, heroPosition: 'BTN', result: 'collected', hasShowdown: false },
  ],
};

const fixtureCases = [
  {
    name: 'PokerStars cash edge cases',
    fixturePath: 'src/utils/parsers/fixtures/ps/pokerstars_edge_cases_01.txt',
    parse: parsePokerStars,
    expected: cashEdgeCaseExpectations,
  },
  {
    name: 'GGPoker cash edge cases',
    fixturePath: 'src/utils/parsers/fixtures/gg/ggpoker_edge_cases_01.txt',
    parse: parseGGPoker,
    expected: cashEdgeCaseExpectations,
  },
  {
    name: 'FanDuel cash edge cases',
    fixturePath: 'src/utils/parsers/fixtures/fanduel/fanduel_edge_cases_01.txt',
    parse: parseFanDuel,
    expected: cashEdgeCaseExpectations,
  },
  {
    name: 'CoinPoker cash edge cases',
    fixturePath: 'src/utils/parsers/fixtures/coinpoker/coinpoker_edge_cases_01.txt',
    parse: parseCoinPoker,
    expected: {
      handsPlayed: 5,
      profit: 12.83,
      allInWinSampleSize: 3,
      allInWinPercentage: 36.4,
      hands: [
        { handNumber: '91600000001', profit: 26.44, heroPosition: 'BTN', result: 'won', allIn: true, ante: 0.04, returnAmount: 1.44 },
        { handNumber: '91600000002', profit: -25.04, heroPosition: 'CO', result: 'lost', allIn: true, ante: 0.04 },
        { handNumber: '91600000003', profit: 0.89, heroPosition: 'HJ', result: 'collected', ante: 0.04, returnAmount: 0.72 },
        { handNumber: '91600000004', profit: 0.54, heroPosition: 'BTN', tableSize: 2, result: 'collected', ante: 0.04, returnAmount: 0.6 },
        {
          handNumber: '91600000005',
          profit: 10,
          heroPosition: 'UTG',
          result: 'won',
          allIn: true,
          ante: 0.04,
          pots: [
            { type: 'main pot', amount: 15 },
            { type: 'side pot', amount: 40 },
          ],
        },
      ],
    },
  },
  {
    name: '888poker cash edge cases',
    fixturePath: 'src/utils/parsers/fixtures/888/888poker_edge_cases_01.txt',
    parse: parse888Poker,
    expected: {
      handsPlayed: 5,
      profit: 10.75,
      allInWinSampleSize: 3,
      allInWinPercentage: 37.3,
      hands: [
        { handNumber: '889900001', profit: 10, heroPosition: 'BTN', result: 'collected', allIn: true },
        { handNumber: '889900002', profit: -10, heroPosition: 'CO', result: 'lost', allIn: true },
        { handNumber: '889900003', profit: 0.45, heroPosition: 'HJ', result: 'collected', returnAmount: 0.6 },
        { handNumber: '889900004', profit: 0.3, heroPosition: 'BTN', tableSize: 2, result: 'collected', returnAmount: 0.4 },
        {
          handNumber: '889900005',
          profit: 10,
          heroPosition: 'UTG',
          result: 'collected',
          allIn: true,
          pots: [
            { type: 'main pot', amount: 15 },
            { type: 'side pot', amount: 10 },
          ],
        },
      ],
    },
  },
  {
    name: 'partypoker cash edge cases',
    fixturePath: 'src/utils/parsers/fixtures/partypoker/partypoker_edge_cases_01.txt',
    parse: parsePartyPoker,
    expected: {
      handsPlayed: 5,
      profit: 10.75,
      allInWinSampleSize: 3,
      allInWinPercentage: 37.4,
      hands: [
        { handNumber: '779900001', profit: 10, heroPosition: 'BTN', result: 'collected', allIn: true },
        { handNumber: '779900002', profit: -10, heroPosition: 'CO', result: 'lost', allIn: true },
        { handNumber: '779900003', profit: 0.45, heroPosition: 'HJ', result: 'collected', returnAmount: 0.6 },
        { handNumber: '779900004', profit: 0.3, heroPosition: 'BTN', tableSize: 2, result: 'collected', returnAmount: 0.4 },
        {
          handNumber: '779900005',
          profit: 10,
          heroPosition: 'UTG',
          result: 'collected',
          allIn: true,
          pots: [
            { type: 'main pot', amount: 15 },
            { type: 'side pot', amount: 10 },
          ],
        },
      ],
    },
  },
];

function hasHeroAllIn(hand) {
  return ['preflop', 'flop', 'turn', 'river'].some((street) =>
    hand[street]?.actions?.some((action) => action.player === hand.hero?.name && action.allIn),
  );
}

function getHeroSummary(hand) {
  return hand.summary?.seats?.find((seat) => seat.player === hand.hero?.name);
}

function expectParsedFixture(fileText, parse, expected) {
  const hands = parse(fileText);
  const stats = calculateStats(hands);

  expect(stats.handsPlayed).toBe(expected.handsPlayed);
  expect(stats.profit).toBe(expected.profit);
  expect(stats.allInWinSampleSize).toBe(expected.allInWinSampleSize);
  expect(stats.allInWinPercentage).toBe(expected.allInWinPercentage);
  expect(hands).toHaveLength(expected.hands.length);

  expected.hands.forEach((expectedHand, index) => {
    const hand = hands[index];
    const heroSummary = getHeroSummary(hand);

    expect(hand.handNumber).toBe(expectedHand.handNumber);
    expect(getHandProfit(hand)).toBe(expectedHand.profit);
    expect(hand.hero?.position).toBe(expectedHand.heroPosition);

    if (expectedHand.result) {
      expect(heroSummary?.result).toBe(expectedHand.result);
    }

    if (expectedHand.tableSize) {
      expect(hand.table?.maxPlayers).toBe(expectedHand.tableSize);
    }

    if (expectedHand.allIn !== undefined) {
      expect(hasHeroAllIn(hand)).toBe(expectedHand.allIn);
    }

    if (expectedHand.pots) {
      expect(hand.summary?.pots).toEqual(expectedHand.pots);
    }

    if (expectedHand.ante !== undefined) {
      expect(hand.table?.ante).toBe(expectedHand.ante);
    }

    if (expectedHand.returnAmount !== undefined) {
      expect(['preflop', 'flop', 'turn', 'river'].flatMap((street) => hand[street]?.actions || [])).toEqual(
        expect.arrayContaining([expect.objectContaining({ action: 'return', amount: expectedHand.returnAmount })]),
      );
    }

    if (expectedHand.hasUncalledBetReturn) {
      expect(hand.flop?.actions).toEqual(expect.arrayContaining([expect.objectContaining({ action: 'return', amount: 0.6 })]));
    }

    if (expectedHand.hasShowdown === false) {
      expect(hand.showdown).toBeNull();
    }
  });
}

describe('parser edge-case fixtures', () => {
  test('CoinPoker sums repeated collected pot lines for split runouts', () => {
    const fileText = `
CoinPoker Hand #111128400721: NLH (₮0.25/₮0.50/₮0.08) 2026/08/14 18:23:58 -04
Table '200906' 6-max Seat #1 is the button
Seat 1: Hero (₮50.07 in chips)
Seat 6: Villain (₮50.00 in chips)
Hero: posts ante ₮0.08
Villain: posts ante ₮0.08
Hero: posts small blind ₮0.25
Villain: posts big blind ₮0.50
*** HOLE CARDS ***
Dealt to Hero [Ac Jd]
Hero: raises ₮1.00 to ₮1.50
Villain: ALLIN ₮44.75
Hero: calls ₮43.25
*** FLOP *** [Ah Js 2c]
*** TURN *** [Ah Js 2c] [8d]
*** RIVER *** [Ah Js 2c 8d] [3h]
*** SHOWDOWN ***
Hero: shows [Ac Jd]
Villain: shows [9h Qh]
Hero collected ₮53.96 from pot
Hero collected ₮53.96 from pot
*** SUMMARY ***
Total pot ₮111.97 | Rake ₮4 | Splash Fee ₮0.05
Board [Ah Js 2c 8d 3h]
Seat 1: Hero showed [Ac Jd] and won (₮53.96) with Two Pair, and won (₮53.96) with Two Pair
Seat 6: Villain showed [9h Qh] and lost with High Card, and lost with High Card
`;
    const [hand] = parseCoinPoker(fileText);

    expect(hand.summary?.seats[0].amount).toBe(107.92);
    expect(getHandProfit(hand)).toBe(63.09);
  });

  test.each(fixtureCases)('$name', ({ fixturePath, parse, expected }) => {
    const fileText = readFileSync(fixturePath, 'utf8');
    expectParsedFixture(fileText, parse, expected);
  });

  test.each(fixtureCases)('$name with Windows CRLF line endings', ({ fixturePath, parse, expected }) => {
    const fileText = readFileSync(fixturePath, 'utf8').replace(/\n/g, '\r\n');
    expectParsedFixture(fileText, parse, expected);
  });

  test.each(fixtureCases)('$name with UTF-8 BOM marker', ({ fixturePath, parse, expected }) => {
    const fileText = `\uFEFF${readFileSync(fixturePath, 'utf8')}`;
    expectParsedFixture(fileText, parse, expected);
  });
});
