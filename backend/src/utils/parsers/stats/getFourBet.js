export function getFourBet(hands) {
  let opportunities = 0;
  let fourBets = 0;

  for (const hand of hands) {
    const hero = hand.hero?.name;
    const actions = hand.preflop?.actions || [];

    if (!hero) continue;

    let heroOpened = false;
    let heroFacedThreeBet = false;
    let firstRaisePlayer = null;

    for (const action of actions) {
      if (!['raise', 'call', 'fold'].includes(action.action)) {
        continue;
      }

      if (!firstRaisePlayer) {
        if (action.action === 'raise') {
          firstRaisePlayer = action.player;
          heroOpened = action.player === hero;
        }

        continue;
      }

      if (heroOpened && action.player !== hero && action.action === 'raise') {
        heroFacedThreeBet = true;
        opportunities++;
        continue;
      }

      if (heroFacedThreeBet && action.player === hero) {
        if (action.action === 'raise') {
          fourBets++;
        }

        break;
      }
    }
  }

  return {
    opportunities,
    fourBets,
    percentage: opportunities === 0 ? 0 : Number(((fourBets / opportunities) * 100).toFixed(2)),
  };
}
