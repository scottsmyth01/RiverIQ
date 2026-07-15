import { getHandsPlayed } from './getHandsPlayed.js';
import { getProfit } from './getProfit.js';
import { getBB100 } from './getBB100.js';
import { getVPIP } from './getVPIP.js';
import { getPFR } from './getPFR.js';
import { getThreeBet } from './getThreeBet.js';
import { getFoldToThreeBet } from './getFoldToThreeBet.js';
import { getSteal } from './getSteal.js';
import { getFoldToCBet } from './getFoldToCBet.js';
import { getCBet } from './getCBet.js';
import { getWTSD } from './getWTSD.js';
import { getWMSD } from './getWMSD.js';
import { getAF } from './getAF.js';

export function calculateStats(hands) {
  return {
    handsPlayed: getHandsPlayed(hands),
    profit: getProfit(hands),
    bb100: getBB100(hands),
    vpip: getVPIP(hands),
    pfr: getPFR(hands),
    threeBet: getThreeBet(hands),
    foldToThreeBet: getFoldToThreeBet(hands),
    steal: getSteal(hands),
    cBet: getCBet(hands),
    foldToCBet: getFoldToCBet(hands),
    wtsd: getWTSD(hands),
    wsd: getWMSD(hands),
    aggressionFactor: getAF(hands),
  };
}
