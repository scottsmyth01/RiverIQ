export function getAF(hands) {
  let bets = 0;
  let raises = 0;
  let calls = 0;

  for (const hand of hands) {
    const hero = hand.hero.name;

    const streets = [hand.flop, hand.turn, hand.river];

    for (const street of streets) {
      if (!street) continue;

      for (const action of street.actions) {
        if (action.player !== hero) continue;

        switch (action.action) {
          case 'bet':
            bets++;
            break;

          case 'raise':
            raises++;
            break;

          case 'call':
            calls++;
            break;
        }
      }
    }
  }

  return {
    bets,
    raises,
    calls,
    aggressionFactor: calls === 0 ? bets + raises : Number(((bets + raises) / calls).toFixed(2)),
  };
}
