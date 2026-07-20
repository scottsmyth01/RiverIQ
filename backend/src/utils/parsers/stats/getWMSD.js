export function getWMSD(hands) {
  let showdowns = 0;
  let wins = 0;

  for (const hand of hands) {
    const hero = hand.hero?.name;
    if (!hero) continue;

    const reachedShowdown = hand.showdown?.actions?.some((action) => action.player === hero);

    if (!reachedShowdown) {
      continue;
    }

    showdowns++;

    const heroSeat = hand.summary?.seats?.find((seat) => seat.player === hero);

    if (heroSeat?.result === 'won' || heroSeat?.result === 'collected') {
      wins++;
    }
  }

  return {
    showdowns,
    wins,
    percentage: showdowns === 0 ? 0 : Number(((wins / showdowns) * 100).toFixed(2)),
  };
}
