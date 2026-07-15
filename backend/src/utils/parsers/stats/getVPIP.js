export function getVPIP(hands) {
  let vpipHands = 0;

  for (const hand of hands) {
    const heroName = hand.hero.name;

    const vpip = hand.preflop.actions.some((action) => {
      if (action.player !== heroName) return false;

      return action.action === 'call' || action.action === 'raise';
    });

    if (vpip) {
      vpipHands++;
    }
  }

  return Number(((vpipHands / hands.length) * 100).toFixed(2));
}
