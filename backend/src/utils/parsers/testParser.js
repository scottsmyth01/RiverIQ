import { parseGGPoker } from './ggpoker/wrapper.js';
import { gg_hands as fileText } from './ggpoker/ggpoker_nlhe_9max_100_hands_production_style.js';
import { pokerstars_hands as fileText2 } from './pokerstars/pokerstars_100_hands.js';
import { getHandsPlayed } from './stats/getHandsPlayed.js';
import { getProfit } from './stats/getProfit.js';
import { getBB100 } from './stats/getBB100.js';
import { getVPIP } from './stats/getVPIP.js';
import { parsePokerStars } from './pokerstars/wrapper.js';
import { getPFR } from './stats/getPFR.js';
import { getThreeBet } from './stats/getThreeBet.js';
import { getFoldToThreeBet } from './stats/getFoldToThreeBet.js';
import { getSteal } from './stats/getSteal.js';
import { getFoldToCBet } from './stats/getFoldToCBet.js';
import { getCBet } from './stats/getCBet.js';
import { getWTSD } from './stats/getWTSD.js';
import { getWMSD } from './stats/getWMSD.js';
import { getAF } from './stats/getAF.js';
import { calculateStats } from './stats/calculateStats.js';

const hands = parseGGPoker(fileText);

console.log(hands);
console.log(calculateStats(hands));
