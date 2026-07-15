export function getSteal(hands) {
  let opportunities = 0;
  let steals = 0;

  for (const hand of hands) {
    const hero = hand.hero.name;

    const heroPlayer = hand.players.find((player) => player.name === hero);

    const position = heroPlayer.position;

    if (position !== 'CO' && position !== 'BTN' && position !== 'SB') {
      continue;
    }

    let someoneEnteredPot = false;

    for (const action of hand.preflop.actions) {
      if (action.player === hero) {
        opportunities++;

        if (action.action === 'raise') {
          steals++;
        }

        break;
      }

      if (action.action === 'call' || action.action === 'raise') {
        someoneEnteredPot = true;
      }

      if (someoneEnteredPot) {
        break;
      }
    }
  }

  return {
    opportunities,
    steals,
    percentage: opportunities === 0 ? 0 : Number(((steals / opportunities) * 100).toFixed(2)),
  };
}
