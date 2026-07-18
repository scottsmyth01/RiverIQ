export function getTurnCBet(hands) {
  let opportunities = 0;
  let turnCBets = 0;

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

    if (lastRaiser !== hero) continue;
    if (!flopActions.length || !turnActions.length) continue;

    const heroFlopAction = flopActions.find((action) => action.player === hero);

    if (heroFlopAction?.action !== 'bet') continue;

    opportunities++;

    const heroTurnAction = turnActions.find((action) => action.player === hero);

    if (heroTurnAction?.action === 'bet') {
      turnCBets++;
    }
  }

  return {
    opportunities,
    turnCBets,
    percentage: opportunities === 0 ? 0 : Number(((turnCBets / opportunities) * 100).toFixed(2)),
  };
}
