import { getHandsPlayed } from './getHandsPlayed.js';
import { getProfit } from './getProfit.js';
import { getBB100 } from './getBB100.js';
import { getVPIP } from './getVPIP.js';
import { getPFR } from './getPFR.js';
import { getThreeBet } from './getThreeBet.js';
import { getFoldToThreeBet } from './getFoldToThreeBet.js';
import { getThreeBetVsOpen } from './getThreeBetVsOpen.js';
import { getSteal } from './getSteal.js';
import { getFoldToCBet } from './getFoldToCBet.js';
import { getCBet } from './getCBet.js';
import { getTurnCBet } from './getTurnCBet.js';
import { getFoldToTurnCBet } from './getFoldToTurnCBet.js';
import { getHandsByPosition } from './getHandsByPosition.js';
import { getWTSD } from './getWTSD.js';
import { getWMSD } from './getWMSD.js';
import { getAF } from './getAF.js';

function calculateBasicStats(hands) {
  const threeBet = getThreeBet(hands);
  const foldToThreeBet = getFoldToThreeBet(hands);
  const steal = getSteal(hands);
  const cBet = getCBet(hands);
  const foldToCBet = getFoldToCBet(hands);
  const turnCBet = getTurnCBet(hands);
  const foldToTurnCBet = getFoldToTurnCBet(hands);
  const wtsd = getWTSD(hands);
  const wsd = getWMSD(hands);
  const aggression = getAF(hands);

  return {
    handsPlayed: getHandsPlayed(hands),
    profit: getProfit(hands),
    bb100: getBB100(hands),
    vpip: getVPIP(hands),
    pfr: getPFR(hands),
    threeBet: threeBet.percentage,
    foldToThreeBet: foldToThreeBet.percentage,
    steal: steal.percentage,
    cBet: cBet.percentage,
    foldToCBet: foldToCBet.percentage,
    turnCBet: turnCBet.percentage,
    foldToTurnCBet: foldToTurnCBet.percentage,
    wtsd: wtsd.percentage,
    wsd: wsd.percentage,
    aggressionFactor: aggression.aggressionFactor,
  };
}

function getStatsByPosition(hands) {
  const positionHands = hands.reduce((positions, hand) => {
    const position = hand.hero?.position || hand.position;

    if (!position) return positions;

    if (!positions[position]) {
      positions[position] = [];
    }

    positions[position].push(hand);

    return positions;
  }, {});

  return Object.entries(positionHands).reduce((stats, [position, handsForPosition]) => {
    stats[position] = calculateBasicStats(handsForPosition);
    return stats;
  }, {});
}

export function calculateStats(hands) {
  return {
    ...calculateBasicStats(hands),
    byPosition: getStatsByPosition(hands),
    handsByPosition: getHandsByPosition(hands),
    threeBetVsOpen: getThreeBetVsOpen(hands),
  };
}
