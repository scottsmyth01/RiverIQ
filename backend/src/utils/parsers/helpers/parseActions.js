import { getAllAmounts, getFirstAmount, MONEY_PATTERN } from './amounts.js';

export function parseActions(actionLines) {
  const actions = [];

  for (const line of actionLines) {
    let match;

    match = line.match(new RegExp(`^Uncalled bet \\(${MONEY_PATTERN.source}\\) returned to (.+)$`, 'i'));

    if (match) {
      actions.push({
        player: match[2].trim(),
        action: 'return',
        amount: getFirstAmount(match[1]),
        raw: line,
      });
      continue;
    }

    match = line.match(new RegExp(`^(.+?): RETURN ${MONEY_PATTERN.source}$`, 'i'));

    if (match) {
      actions.push({
        player: match[1].trim(),
        action: 'return',
        amount: getFirstAmount(match[2]),
        raw: line,
      });
      continue;
    }

    match = line.match(/^(.+?): (.+)$/);

    if (!match) continue;

    const player = match[1];
    const actionText = match[2];
    const lowerActionText = actionText.toLowerCase();

    const action = {
      player,
      raw: line,
    };

    if (lowerActionText.startsWith('checks')) {
      action.action = 'check';
    }
    else if (lowerActionText.startsWith('allin')) {
      action.action = 'bet';
      action.amount = getFirstAmount(actionText);
      action.allIn = true;
    }
    else if (lowerActionText.startsWith('posts')) {
      action.action = 'post';
      action.amount = getFirstAmount(actionText);

      if (lowerActionText.includes('small blind')) {
        action.blind = 'small';
      } else if (lowerActionText.includes('big blind')) {
        action.blind = 'big';
      } else if (lowerActionText.includes('ante')) {
        action.blind = 'ante';
      }
    }
    else if (lowerActionText.startsWith('bets')) {
      action.action = 'bet';
      action.amount = getFirstAmount(actionText);
    }
    else if (lowerActionText.startsWith('calls')) {
      action.action = 'call';
      action.amount = getFirstAmount(actionText);
    }
    else if (lowerActionText.startsWith('raises')) {
      action.action = 'raise';
      const amounts = getAllAmounts(actionText);

      if (amounts.length >= 2) {
        action.amount = amounts[0];
        action.raiseTo = amounts[1];
      } else if (amounts.length === 1) {
        action.amount = amounts[0];
        action.raiseTo = amounts[0];
      }
    }
    else if (lowerActionText.startsWith('folds')) {
      action.action = 'fold';
    }
    else if (lowerActionText.startsWith('mucks')) {
      action.action = 'mucks';
    }
    else if (lowerActionText.startsWith('shows')) {
      action.action = 'shows';
      const cardsMatch = actionText.match(/shows \[([^\]]+)\]/i);
      action.cards = cardsMatch ? cardsMatch[1].split(' ') : [];
    }
    else {
      action.action = 'unknown';
    }

    if (lowerActionText.includes('all-in') || lowerActionText.includes('all in') || lowerActionText.includes('allin')) {
      action.allIn = true;
    }

    actions.push(action);
  }

  return actions;
}
