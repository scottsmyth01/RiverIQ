import { parseHand } from '../parser.js';
import { REGEX } from './regex.js';

export function splitHands(fileText) {
  return fileText
    .split(REGEX.handStart)
    .map((handText) => handText.trim())
    .filter((handText) => handText.startsWith('GGPoker Hand #'));
}

export function parseGGPoker(fileText) {
  const handTexts = splitHands(fileText);
  const hands = [];

  for (const handText of handTexts) {
    hands.push(parseHand(handText, REGEX));
  }

  return hands;
}
