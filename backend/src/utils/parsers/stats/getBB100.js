import { getProfit } from './getProfit.js';
import { getHandsPlayed } from './getHandsPlayed.js';

export function getBB100(hands) {
  const profit = getProfit(hands);
  const handsPlayed = getHandsPlayed(hands);

  if (handsPlayed === 0) {
    return 0;
  }

  const bigBlind = hands[0].table.bigBlind;

  return Number(((profit / bigBlind / handsPlayed) * 100).toFixed(2));
}
