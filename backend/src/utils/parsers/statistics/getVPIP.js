export function getVPIP(hands) {
  let vpipHands = 0;

  for (const hand of hands) {
    const hero = hand?.hero?.name;
    let vpip = false;
    for (const action of hand.preflop.actions) {
      if (action.player !== hero) continue;
      if (action.action === 'call' || action.action === 'raise') {
        vpip = true;
        break;
      }
    }
    if (vpip) {
      vpipHands++;
    }
  }
  return {
    hands: hands.length,
    vpipHands,
    vpip: hands.length === 0 ? 0 : Number(((vpipHands / hands.length) * 100).toFixed(2)),
  };
}
