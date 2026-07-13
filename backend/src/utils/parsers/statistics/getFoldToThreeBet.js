export function getFoldToThreeBet(hands) {
  let opportunities = 0;
  let folds = 0;

  for (const hand of hands) {
    const hero = hand?.hero?.name;

    let heroOpened = false;
    let heroFacingThreeBet = false;

    for (const action of hand.preflop.actions) {
      // Hero opens
      if (action.player === hero && action.action === 'raise' && !heroOpened) {
        heroOpened = true;
        continue;
      }

      // Villain 3-bets Hero
      if (heroOpened && action.player !== hero && action.action === 'raise') {
        heroFacingThreeBet = true;
        opportunities++;
        continue;
      }

      // Hero responds
      if (heroFacingThreeBet && action.player === hero) {
        if (action.action === 'fold') {
          folds++;
        }

        break;
      }
    }
  }

  return {
    hands: hands.length,
    opportunities,
    folds,
    foldToThreeBet: opportunities === 0 ? 0 : Number(((folds / opportunities) * 100).toFixed(2)),
  };
}
