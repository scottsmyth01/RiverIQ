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

// FUNCTION 2 - get profit for current hand (from for loop)
// CALLS FUNCTIONS - getHeroInvested/getHeroCollected
function getHandProfit(hand, hero = 'Hero') {
  const invested = getHeroInvested(hand, hero);
  const collected = getHeroCollected(hand, hero);
  return collected - invested;
}

// GET TOTAL PROFIT - **WORKING
function getTotalProfit(fileText, hero = 'Hero') {
  const hands = splitIntoHands(fileText);
  let totalProfit = 0;
  for (const hand of hands) {
    totalProfit += getHandProfit(hand, hero);
  }
  return Number(totalProfit.toFixed(2));
}
