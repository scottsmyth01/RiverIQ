import { parseHand } from '../parser.js';
import { REGEX } from './regex.js';

export function splitHands(file) {
  const hands = file.split(/(?=PokerStars Hand #)/).filter(Boolean);
  hands.shift();
  return hands;
}

export function parsePokerStars(fileText) {
  const handTexts = splitHands(fileText);
  const hands = [];

  for (const handText of handTexts) {
    hands.push(parseHand(handText, REGEX));
  }

  return hands;
}
