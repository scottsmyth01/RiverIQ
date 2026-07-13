export function getPFR(hands) {
  let pfrHands = 0;

  for (const hand of hands) {
    const hero = hand?.hero?.name;
    let pfr = false;

    for (const action of hand.preflop.actions) {
      if (action.player !== hero) continue;

      if (action.action === 'raise') {
        pfr = true;
        break;
      }
    }
    if (pfr) {
      pfrHands++;
    }
  }
  return {
    hands: hands.length,
    pfrHands,
    pfr: hands.length === 0 ? 0 : Number(((pfrHands / hands.length) * 100).toFixed(2)),
  };
}
