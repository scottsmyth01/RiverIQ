export function getFoldToThreeBet(hands) {
  let opportunities = 0;
  let folds = 0;

  for (const hand of hands) {
    const hero = hand.hero.name;
    const actions = hand.preflop.actions;

    let heroOpened = false;
    let heroFacedThreeBet = false;

    for (const action of actions) {
      if (action.player === hero && action.action === 'raise' && !heroOpened) {
        heroOpened = true;
        continue;
      }

      if (heroOpened && action.player !== hero && action.action === 'raise') {
        heroFacedThreeBet = true;
        opportunities++;
        continue;
      }

      if (heroFacedThreeBet && action.player === hero) {
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
