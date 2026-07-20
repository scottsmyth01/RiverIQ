import { getFirstAmount, MONEY_PATTERN } from './amounts.js';

export function parseShowdownActions(lines) {
  const actions = [];

  for (const line of lines) {
    let match;

    // Hero: shows [Ah Qh]
    // Hero: shows [Ah Qh] (One Pair, Queens)
    match = line.match(/^(.+?): shows \[([^\]]+)\](?: \((.+)\))?$/);

    if (match) {
      actions.push({
        player: match[1],
        action: 'shows',
        cards: match[2].split(' '),
        hand: match[3] || null,
      });
      continue;
    }

    // NitMode: mucks hand
    match = line.match(/^(.+?): mucks hand$/);

    if (match) {
      actions.push({
        player: match[1],
        action: 'mucks',
      });
      continue;
    }

    // Hero collected $3.65 from pot/main pot/side pot
    match = line.match(new RegExp(`^(.+?) collected ${MONEY_PATTERN.source} from (?:the )?(.*?pot)$`, 'i'));

    if (match) {
      actions.push({
        player: match[1],
        action: 'collects',
        amount: getFirstAmount(match[2]),
        potType: match[3].toLowerCase() || 'pot',
      });
      continue;
    }

    // Hero: doesn't show hand
    match = line.match(/^(.+?): doesn't show hand$/);

    if (match) {
      actions.push({
        player: match[1],
        action: 'doesntShow',
      });
      continue;
    }
  }

  return actions;
}
