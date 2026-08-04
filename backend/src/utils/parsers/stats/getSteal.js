const STEAL_POSITIONS = new Set(['CO', 'BTN', 'SB']);
const VOLUNTARY_ACTIONS = new Set(['call', 'raise']);
const DECISION_ACTIONS = new Set(['call', 'raise', 'fold', 'check']);

export function getSteal(hands) {
  let opportunities = 0;
  let steals = 0;

  for (const hand of hands) {
    const hero = hand.hero?.name;
    const position = hand.hero?.position || hand.position || hand.players?.find((player) => player.name === hero)?.position;

    if (!hero || !STEAL_POSITIONS.has(position)) {
      continue;
    }

    let someoneEnteredPot = false;

    for (const action of hand.preflop?.actions || []) {
      if (!DECISION_ACTIONS.has(action.action)) {
        continue;
      }

      if (action.player === hero) {
        opportunities++;

        if (action.action === 'raise') {
          steals++;
        }

        break;
      }

      if (VOLUNTARY_ACTIONS.has(action.action)) {
        someoneEnteredPot = true;
      }

      if (someoneEnteredPot) {
        break;
      }
    }
  }

  return {
    opportunities,
    steals,
    percentage: opportunities === 0 ? 0 : Number(((steals / opportunities) * 100).toFixed(2)),
  };
}
