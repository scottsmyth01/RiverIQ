import { parseHand } from '../parser.js';
import { REGEX } from './regex.js';

export function splitHands(file) {
  return file
    .split(REGEX.handStart)
    .map((handText) => handText.trim())
    .filter((handText) => /^FanDuel (?:Hand|Game) #/.test(handText));
}

export function parseFanDuel(fileText) {
  return splitHands(fileText).map((handText) => parseHand(handText, REGEX));
}
