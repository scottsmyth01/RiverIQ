export function getCBet(hands) {
  let opportunities = 0;
  let cBets = 0;

  for (const hand of hands) {
    const hero = hand.hero.name;
    let lastRaiser = null;

    for (const action of hand.preflop.actions) {
      if (action.action === 'raise') {
        lastRaiser = action.player;
      }
    }

    if (lastRaiser !== hero) continue;
    if (!hand.flop) continue;

    opportunities++;

    const heroAction = hand.flop.actions.find((action) => action.player === hero);

    if (heroAction?.action === 'bet') {
      cBets++;
    }
  }

  return {
    opportunities,
    cBets,
    percentage: opportunities === 0 ? 0 : Number(((cBets / opportunities) * 100).toFixed(2)),
  };
}
