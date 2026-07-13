export function getThreeBet(hands) {
  let opportunities = 0;
  let threeBets = 0;

  for (const hand of hands) {
    const hero = hand?.hero?.name;
    let raiseSeen = false;

    for (const action of hand.preflop.actions) {
      if (action.player !== hero && action.action === 'raise') {
        raiseSeen = true;
        continue;
      }
      if (action.player !== hero) continue;

      if (raiseSeen) {
        opportunities++;
        if (action.action === 'raise') {
          threeBets++;
        }
        break;
      }
      break;
    }
  }

  return {
    hands: hands.length,
    opportunities,
    threeBets,
    threeBetPercentage: opportunities === 0 ? 0 : Number(((threeBets / opportunities) * 100).toFixed(2)),
  };
}
