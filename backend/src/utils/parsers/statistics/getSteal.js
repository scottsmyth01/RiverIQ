export function getSteal(hands) {
  let opportunities = 0;
  let steals = 0;

  for (const hand of hands) {
    const hero = hand?.hero?.name;

    // Hero must be in a stealing position
    if (hand.position !== 'CO' && hand.position !== 'BTN' && hand.position !== 'SB') {
      continue;
    }

    let potOpened = false;

    for (const action of hand.preflop.actions) {
      // Ignore Hero until it's their turn
      if (action.player === hero) {
        // Nobody entered the pot before Hero
        if (!potOpened) {
          opportunities++;

          if (action.action === 'raise') {
            steals++;
          }
        }

        // Hero has acted, we're done with this hand
        break;
      }

      // Someone else voluntarily entered the pot
      if (action.action === 'call' || action.action === 'raise') {
        potOpened = true;
      }
    }
  }

  return {
    hands: hands.length,
    opportunities,
    steals,
    stealPercentage: opportunities === 0 ? 0 : Number(((steals / opportunities) * 100).toFixed(2)),
  };
}
