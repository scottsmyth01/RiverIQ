export function getThreeBet(hands) {
  let opportunities = 0;
  let threeBets = 0;

  for (const hand of hands) {
    const heroName = hand.hero.name;
    const actions = hand.preflop.actions;
    let firstRaisePlayer = null;

    for (const action of actions) {
      if (action.action !== 'raise' && action.action !== 'call' && action.action !== 'fold') {
        continue;
      }

      if (!firstRaisePlayer) {
        if (action.action === 'raise') {
          firstRaisePlayer = action.player;
        }

        continue;
      }

      if (firstRaisePlayer === heroName) {
        break;
      }

      if (action.action === 'raise') {
        if (action.player === heroName) {
          opportunities++;
          threeBets++;
        }

        break;
      }

      if (action.player === heroName) {
        opportunities++;
        break;
      }
    }
  }

  return {
    opportunities,
    threeBets,
    percentage: opportunities === 0 ? 0 : Number(((threeBets / opportunities) * 100).toFixed(2)),
  };
}
