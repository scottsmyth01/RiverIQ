import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../data/pokerstars_150_hands_sample.txt');
const fileText = await fs.readFile(filePath, 'utf8');

// FUNCTION 1 - get array of hands
function splitIntoHands(fileText) {
  return fileText.split(/(?=PokerStars Hand #)/).filter((hand) => hand.trim() !== '');
}
const hands = splitIntoHands(fileText);

const stats = {
  handsPlayed: hands.length,
  profit: getProfit(hands),
  bb100: getbb100(hands),
  // vpip: getVPIP(hands),
  // pfr: getPFR(hands),
  // threeBet: getThreeBet(hands),
  // foldToThreeBet: getFoldToThreeBet(hands),
  // cBet: getCBet(hands),
  // foldToCBet: getFoldToCBet(hands),
};

export function getSessionStakes(handText) {
  const match = handText.match(/\$([\d.]+)\/\$([\d.]+)\s([A-Z]{3})/);
  if (!match) return null;
  return {
    smallBlind: Number(match[1]),
    bigBlind: Number(match[2]),
    currency: match[3],
    stakeString: `${match[1]}/${match[2]}`,
  };
}

// GET TOTAL PROFIT

function getProfit(hands, hero = 'Hero') {
  let totalProfit = 0;
  for (const hand of hands) {
    totalProfit += getHandProfit(hand, hero);
  }
  return Number(totalProfit.toFixed(2));
}

function getHandProfit(hand, hero = 'Hero') {
  const invested = getHeroInvested(hand, hero);
  const collected = getHeroCollected(hand, hero);
  return collected - invested;
}

function getHeroInvested(hand, hero = 'Hero') {
  const lines = hand.split('\n');
  let total = 0;

  for (const line of lines) {
    if (!line.startsWith(`${hero}:`)) continue;
    if (line.includes('raises')) {
      const match = line.match(/to \$([\d.]+)/);
      if (match) total += Number(match[1]);
    }
    if (
      line.includes('calls') ||
      line.includes('bets') ||
      line.includes('posts small blind') ||
      line.includes('posts big blind')
    ) {
      const match = line.match(/\$([\d.]+)/);
      if (match) total += Number(match[1]);
    }
  }
  return total;
}

function getHeroCollected(hand, hero = 'Hero') {
  const regex = new RegExp(`${hero} collected \\$([\\d.]+) from pot`, 'g');
  let total = 0;
  let match;

  while ((match = regex.exec(hand)) !== null) {
    total += Number(match[1]);
  }
  return total;
}

// GET BB/100 - **WORKING
function getbb100(hands) {
  const profit = getProfit(hands);
  const stakes = getSessionStakes(hands[0]);
  const handsPlayed = hands.length;

  const bb100 = (profit * 100) / (stakes.bigBlind * handsPlayed);
  return bb100.toFixed(2);
}

export function parseHandHistory(fileText, options = {}) {
  const hands = splitIntoHands(fileText);
  const stats = {
    handsPlayed: hands.length,
    profit: getProfit(hands),
    bb100: getbb100(hands),
    // vpip: getVPIP(hands),
    // pfr: getPFR(hands),
    // threeBet: getThreeBet(hands),
    // foldToThreeBet: getFoldToThreeBet(hands),
    // cBet: getCBet(hands),
    // foldToCBet: getFoldToCBet(hands),
  };

  const stakes = getSessionStakes(fileText);

  return {
    stats,
    stakes,
  };
}
