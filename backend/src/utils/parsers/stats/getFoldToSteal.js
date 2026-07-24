const STEAL_POSITIONS = new Set(['CO', 'BTN', 'SB']);
const BLIND_POSITIONS = new Set(['SB', 'BB']);
const VOLUNTARY_ACTIONS = new Set(['call', 'raise']);

function getPlayerPosition(hand, playerName) {
  return hand.players?.find((player) => player.name === playerName)?.position;
}

export function getFoldToSteal(hands) {
  let opportunities = 0;
  let folds = 0;

  for (const hand of hands) {
    const heroName = hand.hero?.name;
    const heroPosition = hand.hero?.position || hand.position;

    if (!heroName || !BLIND_POSITIONS.has(heroPosition)) {
      continue;
    }

    let stealRaisePlayer = null;
    let potEnteredBeforeSteal = false;

    for (const action of hand.preflop?.actions || []) {
      if (!VOLUNTARY_ACTIONS.has(action.action) && action.action !== 'fold') {
        continue;
      }

      if (!stealRaisePlayer) {
        if (action.player === heroName) {
          break;
        }

        if (VOLUNTARY_ACTIONS.has(action.action)) {
          const position = getPlayerPosition(hand, action.player);

          if (!potEnteredBeforeSteal && action.action === 'raise' && STEAL_POSITIONS.has(position)) {
            stealRaisePlayer = action.player;
            opportunities++;
            continue;
          }

          potEnteredBeforeSteal = true;
        }

        continue;
      }

      if (action.player === heroName) {
        if (action.action === 'fold') {
          folds++;
        }

        break;
      }
    }
  }

  return {
    opportunities,
    folds,
    percentage: opportunities === 0 ? 0 : Number(((folds / opportunities) * 100).toFixed(2)),
  };
}
