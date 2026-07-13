import { getPositions } from '../helpers/getPositions';

export function getFoldToSteal(hands) {
  let opportunities = 0;
  let folds = 0;

  for (const hand of hands) {
    const hero = hand.hero.name;

    // Hero must be in the blinds
    if (hand.position !== 'SB' && hand.position !== 'BB') {
      continue;
    }

    let openerPosition = null;

    for (const action of hand.preflop.actions) {
      // First raise opens the pot
      if (action.action === 'raise' && openerPosition === null) {
        const opener = hand.players.find((player) => player.name === action.player);

        if (!opener) break;

        const openerHand = {
          ...hand,
          hero: { name: opener.name },
        };

        openerPosition = getPositions(openerHand);

        continue;
      }

      // Hero responds
      if (action.player === hero && openerPosition) {
        const stealAttempt =
          (hand.position === 'BB' &&
            (openerPosition === 'BTN' || openerPosition === 'SB' || openerPosition === 'CO')) ||
          (hand.position === 'SB' && (openerPosition === 'BTN' || openerPosition === 'CO'));

        if (stealAttempt) {
          opportunities++;

          if (action.action === 'fold') {
            folds++;
          }
        }

        break;
      }
    }
  }

  return {
    hands: hands.length,
    opportunities,
    folds,
    foldToSteal: opportunities === 0 ? 0 : Number(((folds / opportunities) * 100).toFixed(2)),
  };
}
