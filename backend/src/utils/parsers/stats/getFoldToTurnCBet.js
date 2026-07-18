export function getFoldToTurnCBet(hands) {
  let opportunities = 0;
  let folds = 0;

  for (const hand of hands) {
    const hero = hand.hero?.name;
    const preflopActions = hand.preflop?.actions || [];
    const flopActions = hand.flop?.actions || [];
    const turnActions = hand.turn?.actions || [];
    let lastRaiser = null;

    for (const action of preflopActions) {
      if (action.action === 'raise') {
        lastRaiser = action.player;
      }
    }

    if (!lastRaiser || lastRaiser === hero) continue;
    if (!flopActions.length || !turnActions.length) continue;

    const aggressorFlopAction = flopActions.find((action) => action.player === lastRaiser);
    const heroFlopAction = flopActions.find((action) => action.player === hero);

    if (aggressorFlopAction?.action !== 'bet') continue;
    if (heroFlopAction?.action !== 'call') continue;

    const aggressorTurnAction = turnActions.find((action) => action.player === lastRaiser);

    if (aggressorTurnAction?.action !== 'bet') continue;

    opportunities++;

    const heroTurnAction = turnActions.find((action) => action.player === hero);

    if (heroTurnAction?.action === 'fold') {
      folds++;
    }
  }

  return {
    opportunities,
    folds,
    percentage: opportunities === 0 ? 0 : Number(((folds / opportunities) * 100).toFixed(2)),
  };
}
