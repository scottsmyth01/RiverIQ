export function getPFR(hands) {
  let pfrHands = 0;

  for (const hand of hands) {
    const heroName = hand.hero.name;

    const pfr = hand.preflop.actions.some((action) => {
      return action.player === heroName && action.action === 'raise';
    });

    if (pfr) {
      pfrHands++;
    }
  }

  return Number(((pfrHands / hands.length) * 100).toFixed(2));
}
