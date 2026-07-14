import { parseActions } from './parseActions.js';

export function parseStreet(handText, regex, cardType = 'board') {
  const match = handText.match(regex);

  if (!match) {
    return null;
  }

  const cards = cardType === 'board' ? match[1].split(' ') : match[1];

  const actionLines = match[2]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return {
    [cardType]: cards,
    actions: parseActions(actionLines),
  };
}
