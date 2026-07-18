const RANK_VALUE = {
  A: 14,
  K: 13,
  Q: 12,
  J: 11,
  T: 10,
  9: 9,
  8: 8,
  7: 7,
  6: 6,
  5: 5,
  4: 4,
  3: 3,
  2: 2,
};

const PLAY_ACTIONS = new Set(['bet', 'call', 'raise']);

function normalizeCard(card) {
  if (typeof card !== 'string' || card.length < 2) return null;

  const rank = card[0].toUpperCase();
  const suit = card.at(-1).toLowerCase();

  if (!RANK_VALUE[rank] || !suit) return null;

  return { rank, suit };
}

export function getStartingHand(cards) {
  if (!Array.isArray(cards) || cards.length !== 2) return null;

  const parsedCards = cards.map(normalizeCard);

  if (parsedCards.some((card) => !card)) return null;

  const [first, second] = parsedCards.sort((a, b) => RANK_VALUE[b.rank] - RANK_VALUE[a.rank]);

  if (first.rank === second.rank) {
    return `${first.rank}${second.rank}`;
  }

  return `${first.rank}${second.rank}${first.suit === second.suit ? 's' : 'o'}`;
}

function getHeroPreflopResult(hand) {
  const heroName = hand.hero?.name;
  const actions = hand.preflop?.actions || [];

  if (!heroName) {
    return { played: false, limped: false, openRaised: false, raised: false, folded: false };
  }

  let hasRaiseBeforeHero = false;
  let limped = false;
  let openRaised = false;

  actions.forEach((action) => {
    if (action.player === heroName) {
      if (action.action === 'call' && !hasRaiseBeforeHero) {
        limped = true;
      }

      if ((action.action === 'raise' || action.action === 'bet') && !hasRaiseBeforeHero) {
        openRaised = true;
      }
    }

    if (action.action === 'raise' || action.action === 'bet') {
      hasRaiseBeforeHero = true;
    }
  });

  const heroActions = actions.filter((action) => action.player === heroName);

  return {
    played: heroActions.some((action) => PLAY_ACTIONS.has(action.action)),
    limped,
    openRaised,
    raised: heroActions.some((action) => action.action === 'raise' || action.action === 'bet'),
    folded: heroActions.some((action) => action.action === 'fold'),
  };
}

export function getHandsByPosition(hands) {
  return hands.reduce((positions, hand) => {
    const position = hand.hero?.position || hand.position;
    const startingHand = getStartingHand(hand.hero?.cards);

    if (!position || !startingHand) return positions;

    if (!positions[position]) {
      positions[position] = {};
    }

    if (!positions[position][startingHand]) {
      positions[position][startingHand] = {
        dealt: 0,
        played: 0,
        called: 0,
        limped: 0,
        openRaised: 0,
        raised: 0,
        folded: 0,
      };
    }

    const result = getHeroPreflopResult(hand);
    const handStats = positions[position][startingHand];

    handStats.dealt++;

    if (result.played) handStats.played++;
    if (result.limped) handStats.limped++;
    if (result.limped) handStats.called++;
    if (result.openRaised) handStats.openRaised++;
    if (result.raised) handStats.raised++;
    if (result.folded) handStats.folded++;

    return positions;
  }, {});
}
