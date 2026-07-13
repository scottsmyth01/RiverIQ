export function getRFI(hands) {
  let opportunities = 0;
  let raises = 0;

  for (const hand of hands) {
    const hero = hand?.hero?.name;
    let potOpened = false;

    for (const action of hand.preflop.actions) {
      // Villain voluntarily enters the pot
      if (action.player !== hero && (action.action === 'call' || action.action === 'raise')) {
        potOpened = true;
      }
      // Hero's first action
      if (action.player === hero) {
        if (!potOpened) {
          opportunities++;
          if (action.action === 'raise') {
            raises++;
          }
        }
        break;
      }
    }
  }

  return {
    hands: hands.length,
    opportunities,
    raises,
    rfi: opportunities === 0 ? 0 : Number(((raises / opportunities) * 100).toFixed(2)),
  };
}
