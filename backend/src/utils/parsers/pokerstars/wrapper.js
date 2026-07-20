import { parseHand } from '../parser.js';
import { REGEX } from './regex.js';

export function splitHands(file) {
  return file
    .split(REGEX.handStart)
    .map((handText) => handText.trim())
    .filter((handText) => /^PokerStars (?:Zoom )?(?:Hand|Game) #/.test(handText));
}

export function parsePokerStars(fileText) {
  const handTexts = splitHands(fileText);
  const hands = [];

  for (const handText of handTexts) {
    hands.push(parseHand(handText, REGEX));
  }

  return hands;
}
