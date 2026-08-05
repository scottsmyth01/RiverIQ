import { parseHand } from '../parser.js';
import { normalizeFileText } from '../helpers/normalizeFileText.js';
import { REGEX } from './regex.js';

export function splitHands(fileText) {
  return normalizeFileText(fileText)
    .split(REGEX.handStart)
    .map((handText) => handText.trim())
    .filter((handText) => handText.startsWith('CoinPoker Hand #'));
}

export function parseCoinPoker(fileText) {
  const handTexts = splitHands(fileText);
  const hands = [];

  for (const handText of handTexts) {
    const hand = parseHand(handText, REGEX);

    if (hand.table?.game === 'NLH') {
      hand.table.game = 'NL Holdem';
    }

    hands.push(hand);
  }

  return hands;
}
