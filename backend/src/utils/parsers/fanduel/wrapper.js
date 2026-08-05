import { parseHand } from '../parser.js';
import { normalizeFileText } from '../helpers/normalizeFileText.js';
import { REGEX } from './regex.js';

export function splitHands(file) {
  return normalizeFileText(file)
    .split(REGEX.handStart)
    .map((handText) => handText.trim())
    .filter((handText) => /^FanDuel (?:Hand|Game) #/.test(handText));
}

export function parseFanDuel(fileText) {
  return splitHands(fileText).map((handText) => parseHand(handText, REGEX));
}
