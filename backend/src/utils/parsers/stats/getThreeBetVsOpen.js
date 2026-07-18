function getPlayerPosition(hand, playerName) {
  return hand.players?.find((player) => player.name === playerName)?.position || null;
}

export function getThreeBetVsOpen(hands) {
  const matrix = {};

  for (const hand of hands) {
    const hero = hand.hero?.name;
    const actions = hand.preflop?.actions || [];
    let opener = null;
    let heroFacedOpen = false;

    for (const action of actions) {
      if (!opener) {
        if (action.action === 'raise') {
          opener = action.player;
        }

        continue;
      }

      if (opener === hero) {
        break;
      }

      if (action.player !== hero) {
        if (action.action === 'raise') {
          break;
        }

        continue;
      }

      if (!['call', 'fold', 'raise'].includes(action.action)) {
        continue;
      }

      heroFacedOpen = true;
      const openerPosition = getPlayerPosition(hand, opener);
      const heroPosition = getPlayerPosition(hand, hero);

      if (!openerPosition || !heroPosition) {
        break;
      }

      if (!matrix[openerPosition]) {
        matrix[openerPosition] = {};
      }

      if (!matrix[openerPosition][heroPosition]) {
        matrix[openerPosition][heroPosition] = {
          opportunities: 0,
          threeBets: 0,
          percentage: 0,
        };
      }

      matrix[openerPosition][heroPosition].opportunities++;

      if (action.action === 'raise') {
        matrix[openerPosition][heroPosition].threeBets++;
      }

      break;
    }

    if (!heroFacedOpen) continue;
  }

  Object.values(matrix).forEach((matchups) => {
    Object.values(matchups).forEach((matchup) => {
      matchup.percentage =
        matchup.opportunities === 0 ? 0 : Number(((matchup.threeBets / matchup.opportunities) * 100).toFixed(2));
    });
  });

  return matrix;
}
