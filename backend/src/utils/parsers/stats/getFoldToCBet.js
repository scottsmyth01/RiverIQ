export function getFoldToCBet(hands) {
  let opportunities = 0;
  let folds = 0;

  for (const hand of hands) {
    const hero = hand.hero.name;

    let lastRaiser = null;

    for (const action of hand.preflop.actions) {
      if (action.action === 'raise') {
        lastRaiser = action.player;
      }
    }

    if (lastRaiser === hero) continue;

    if (!hand.flop) continue;

    const aggressorAction = hand.flop.actions.find((action) => action.player === lastRaiser);

    if (!aggressorAction || aggressorAction.action !== 'bet') {
      continue;
    }

    opportunities++;

    const heroAction = hand.flop.actions.find((action) => action.player === hero);

    if (heroAction?.action === 'fold') {
      folds++;
    }
  }

  return {
    opportunities,
    folds,
    percentage: opportunities === 0 ? 0 : Number(((folds / opportunities) * 100).toFixed(2)),
  };
}
