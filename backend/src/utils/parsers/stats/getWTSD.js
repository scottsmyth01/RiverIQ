export function getWTSD(hands) {
  let flopsSeen = 0;
  let showdowns = 0;

  for (const hand of hands) {
    const hero = hand.hero.name;

    if (!hand.flop) continue;

    const foldedPreflop = hand.preflop.actions.some((action) => action.player === hero && action.action === 'fold');

    if (foldedPreflop) continue;

    flopsSeen++;

    const reachedShowdown = hand.showdown?.actions?.some((action) => action.player === hero);

    if (reachedShowdown) {
      showdowns++;
    }
  }

  return {
    flopsSeen,
    showdowns,
    percentage: flopsSeen === 0 ? 0 : Number(((showdowns / flopsSeen) * 100).toFixed(2)),
  };
}
