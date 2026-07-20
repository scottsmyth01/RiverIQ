export function getFoldToFourBet(hands) {
  let opportunities = 0;
  let folds = 0;

  for (const hand of hands) {
    const hero = hand.hero?.name;
    const actions = hand.preflop?.actions || [];

    if (!hero) continue;

    let firstRaisePlayer = null;
    let heroThreeBet = false;
    let heroFacedFourBet = false;

    for (const action of actions) {
      if (!['raise', 'call', 'fold'].includes(action.action)) {
        continue;
      }

      if (!firstRaisePlayer) {
        if (action.action === 'raise') {
          firstRaisePlayer = action.player;
        }

        continue;
      }

      if (!heroThreeBet && action.player === hero && action.action === 'raise' && firstRaisePlayer !== hero) {
        heroThreeBet = true;
        continue;
      }

      if (heroThreeBet && action.player !== hero && action.action === 'raise') {
        heroFacedFourBet = true;
        opportunities++;
        continue;
      }

      if (heroFacedFourBet && action.player === hero) {
        if (action.action === 'fold') {
          folds++;
        }

        break;
      }
    }
  }

  return {
    opportunities,
    folds,
    percentage: opportunities === 0 ? 0 : Number(((folds / opportunities) * 100).toFixed(2)),
  };
}
