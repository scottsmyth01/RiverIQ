export function getProfit(hands) {
  let profit = 0;

  for (const hand of hands) {
    const heroName = hand.hero?.name;
    const hero = hand.summary?.seats?.find((seat) => seat.player === heroName);

    if (!hero) {
      continue;
    }

    if (hero.result === 'won' || hero.result === 'collected') {
      profit += hero.amount;
    }

    profit -= getHeroInvestment(hand);
  }

  return Number(profit.toFixed(2));
}

export function getHeroInvestment(hand) {
  let invested = 0;
  const heroName = hand.hero?.name;

  const streets = [hand.preflop, hand.flop, hand.turn, hand.river];

  for (const street of streets) {
    if (!street || !Array.isArray(street.actions)) continue;

    let committed = 0;

    for (const action of street.actions) {
      if (action.player !== heroName) continue;

      if (action.action === 'post' || action.action === 'posts') {
        invested += action.amount;
        committed = action.amount;
      } else if (action.action === 'call') {
        invested += action.amount;
        committed += action.amount;
      } else if (action.action === 'bet') {
        invested += action.amount;
        committed = action.amount;
      } else if (action.action === 'raise') {
        const raiseTo = action.raiseTo ?? action.amount;
        const additional = raiseTo - committed;

        invested += additional;

        committed = raiseTo;
      }
    }
  }

  return Number(invested.toFixed(2));
}
