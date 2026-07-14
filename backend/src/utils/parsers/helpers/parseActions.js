export function parseActions(actionLines) {
  const actions = [];

  for (const line of actionLines) {
    const match = line.match(/^(.+?): (.+)$/);

    if (!match) continue;

    const player = match[1];
    const actionText = match[2];

    const action = {
      player,
    };

    // CHECK

    if (actionText.startsWith('checks')) {
      action.action = 'check';
    }

    // BET
    else if (actionText.startsWith('bets')) {
      action.action = 'bet';

      const amountMatch = actionText.match(/\$([\d.]+)/);

      if (amountMatch) {
        action.amount = Number(amountMatch[1]);
      }
    }

    // CALL
    else if (actionText.startsWith('calls')) {
      action.action = 'call';

      const amountMatch = actionText.match(/\$([\d.]+)/);

      if (amountMatch) {
        action.amount = Number(amountMatch[1]);
      }
    }

    // RAISE
    else if (actionText.startsWith('raises')) {
      action.action = 'raise';

      const raiseMatch = actionText.match(/raises \$([\d.]+) to \$([\d.]+)/);

      if (raiseMatch) {
        action.amount = Number(raiseMatch[2]);
      }
    }

    // FOLD
    else if (actionText.startsWith('folds')) {
      action.action = 'fold';
    }

    actions.push(action);
  }

  return actions;
}
