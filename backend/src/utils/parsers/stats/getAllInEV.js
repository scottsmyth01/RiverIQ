import { getHeroInvestment, getProfit } from './getProfit.js';

const RANK_VALUE = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

const RANKS = Object.keys(RANK_VALUE);
const SUITS = ['c', 'd', 'h', 's'];
const STREET_ORDER = ['preflop', 'flop', 'turn', 'river'];
const MAX_EQUITY_RUNOUTS = 20000;

function parseCard(card) {
  if (typeof card !== 'string' || card.length < 2) return null;

  const rank = card[0].toUpperCase();
  const suit = card.at(-1).toLowerCase();

  if (!RANK_VALUE[rank] || !SUITS.includes(suit)) return null;

  return `${rank}${suit}`;
}

function getDeck(excludedCards = []) {
  const excluded = new Set(excludedCards);

  return RANKS.flatMap((rank) => SUITS.map((suit) => `${rank}${suit}`)).filter((card) => !excluded.has(card));
}

function getKnownBoard(hand, street) {
  const cards = [];

  if (['flop', 'turn', 'river'].includes(street)) {
    cards.push(...(hand.flop?.board || []));
  }

  if (['turn', 'river'].includes(street) && hand.turn?.card) {
    cards.push(hand.turn.card);
  }

  if (street === 'river' && hand.river?.card) {
    cards.push(hand.river.card);
  }

  return cards.map(parseCard).filter(Boolean);
}

function findHeroAllInStreet(hand) {
  const heroName = hand.hero?.name;

  if (!heroName) return null;

  return STREET_ORDER.find((street) => hand[street]?.actions?.some((action) => action.player === heroName && action.allIn));
}

function getShownCards(hand) {
  const shownCards = new Map();

  hand.summary?.seats?.forEach((seat) => {
    if (seat.player && Array.isArray(seat.cards) && seat.cards.length === 2) {
      shownCards.set(seat.player, seat.cards.map(parseCard).filter(Boolean));
    }
  });

  hand.showdown?.actions?.forEach((action) => {
    if (action.player && action.action === 'shows' && Array.isArray(action.cards) && action.cards.length === 2) {
      shownCards.set(action.player, action.cards.map(parseCard).filter(Boolean));
    }
  });

  return shownCards;
}

function encodeRank(category, values) {
  const paddedValues = [...values, 0, 0, 0, 0, 0].slice(0, 5);
  return paddedValues.reduce((score, value) => score * 15 + value, category);
}

function getStraightHigh(uniqueRanks) {
  const ranks = [...uniqueRanks].sort((a, b) => b - a);

  if (ranks.includes(14)) {
    ranks.push(1);
  }

  for (let index = 0; index <= ranks.length - 5; index++) {
    const window = ranks.slice(index, index + 5);

    if (window.every((rank, rankIndex) => rankIndex === 0 || rank === window[rankIndex - 1] - 1)) {
      return window[0] === 1 ? 5 : window[0];
    }
  }

  return null;
}

function evaluateFive(cards) {
  const ranks = cards.map((card) => RANK_VALUE[card[0]]);
  const suits = cards.map((card) => card[1]);
  const isFlush = suits.every((suit) => suit === suits[0]);
  const rankCounts = ranks.reduce((counts, rank) => ({ ...counts, [rank]: (counts[rank] || 0) + 1 }), {});
  const groupedRanks = Object.entries(rankCounts)
    .map(([rank, count]) => ({ rank: Number(rank), count }))
    .sort((first, second) => second.count - first.count || second.rank - first.rank);
  const straightHigh = getStraightHigh(new Set(ranks));

  if (isFlush && straightHigh) return encodeRank(8, [straightHigh]);
  if (groupedRanks[0].count === 4) return encodeRank(7, [groupedRanks[0].rank, groupedRanks[1].rank]);
  if (groupedRanks[0].count === 3 && groupedRanks[1].count === 2) {
    return encodeRank(6, [groupedRanks[0].rank, groupedRanks[1].rank]);
  }
  if (isFlush) return encodeRank(5, [...ranks].sort((a, b) => b - a));
  if (straightHigh) return encodeRank(4, [straightHigh]);
  if (groupedRanks[0].count === 3) {
    return encodeRank(3, [groupedRanks[0].rank, ...groupedRanks.slice(1).map((item) => item.rank)]);
  }
  if (groupedRanks[0].count === 2 && groupedRanks[1].count === 2) {
    return encodeRank(2, [groupedRanks[0].rank, groupedRanks[1].rank, groupedRanks[2].rank]);
  }
  if (groupedRanks[0].count === 2) {
    return encodeRank(1, [groupedRanks[0].rank, ...groupedRanks.slice(1).map((item) => item.rank)]);
  }

  return encodeRank(0, [...ranks].sort((a, b) => b - a));
}

function evaluateSeven(cards) {
  let bestScore = 0;

  for (let first = 0; first < cards.length - 4; first++) {
    for (let second = first + 1; second < cards.length - 3; second++) {
      for (let third = second + 1; third < cards.length - 2; third++) {
        for (let fourth = third + 1; fourth < cards.length - 1; fourth++) {
          for (let fifth = fourth + 1; fifth < cards.length; fifth++) {
            bestScore = Math.max(bestScore, evaluateFive([cards[first], cards[second], cards[third], cards[fourth], cards[fifth]]));
          }
        }
      }
    }
  }

  return bestScore;
}

function* combinations(cards, size, start = 0, prefix = []) {
  if (prefix.length === size) {
    yield prefix;
    return;
  }

  for (let index = start; index <= cards.length - (size - prefix.length); index++) {
    yield* combinations(cards, size, index + 1, [...prefix, cards[index]]);
  }
}

function getCombinationCount(total, choose) {
  if (choose <= 0) return 1;

  let count = 1;

  for (let index = 1; index <= choose; index++) {
    count = (count * (total - index + 1)) / index;
  }

  return count;
}

function seededRandom(seed) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function sampleRunout(deck, size, random) {
  const cards = [...deck];

  for (let index = cards.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]];
  }

  return cards.slice(0, size);
}

function getHeroEquity({ heroCards, opponentCards, knownBoard, seed = 1 }) {
  const usedCards = [...heroCards, ...opponentCards.flat(), ...knownBoard];
  const deck = getDeck(usedCards);
  const neededBoardCards = 5 - knownBoard.length;

  if (neededBoardCards < 0 || new Set(usedCards).size !== usedCards.length) return null;

  const runoutCount = getCombinationCount(deck.length, neededBoardCards);
  const useExactEnumeration = runoutCount <= MAX_EQUITY_RUNOUTS;
  const runouts = useExactEnumeration
    ? combinations(deck, neededBoardCards)
    : Array.from({ length: MAX_EQUITY_RUNOUTS }, () => sampleRunout(deck, neededBoardCards, seededRandom(seed++)));
  let heroShare = 0;
  let totalRunouts = 0;

  for (const runout of runouts) {
    const board = [...knownBoard, ...runout];
    const scores = [heroCards, ...opponentCards].map((cards) => evaluateSeven([...cards, ...board]));
    const bestScore = Math.max(...scores);
    const winnerCount = scores.filter((score) => score === bestScore).length;

    if (scores[0] === bestScore) {
      heroShare += 1 / winnerCount;
    }

    totalRunouts++;
  }

  return totalRunouts ? heroShare / totalRunouts : null;
}

function getAllInAdjustedHandProfit(hand) {
  const allInStreet = findHeroAllInStreet(hand);
  const heroCards = hand.hero?.cards?.map(parseCard).filter(Boolean) || [];
  const shownCards = getShownCards(hand);
  const opponentCards = [...shownCards.entries()]
    .filter(([player, cards]) => player !== hand.hero?.name && cards.length === 2)
    .map(([, cards]) => cards);
  const totalPot = Number(hand.summary?.totalPot);

  if (!allInStreet || heroCards.length !== 2 || !opponentCards.length || !Number.isFinite(totalPot)) {
    return getProfit([hand]);
  }

  const equity = getHeroEquity({
    heroCards,
    opponentCards,
    knownBoard: getKnownBoard(hand, allInStreet),
    seed: Number(hand.handNumber?.replace(/\D/g, '').slice(-8)) || 1,
  });

  if (equity === null) {
    return getProfit([hand]);
  }

  return Number((equity * totalPot - getHeroInvestment(hand)).toFixed(2));
}

export function getAllInEV(hands) {
  return Number(hands.reduce((total, hand) => total + getAllInAdjustedHandProfit(hand), 0).toFixed(2));
}
