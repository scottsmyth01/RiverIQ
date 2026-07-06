import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../data/pokerstars_150_hands.txt');
const fileText = await fs.readFile(filePath, 'utf8');

// Get array of hands
function getHands(fileText) {
  return fileText.split(/(?=PokerStars Hand #)/).filter((hand) => hand.trim()); //spit at every PokerStars Hand # and filter out empty strings; gives an array of all hands, hand by hand
}

// Extract the pre flop section
// Every advanced stat (VPIP, PFR, 3-Bet, 4-Bet, Steal, etc.) starts with the preflop actions.
function preflopActions(hand) {
  return hand.split('*** HOLE CARDS ***')[1].split('*** ')[0]; //everything after *** HOLE CARDS *** but before *** FLOP ***
}

function structuredPreFlopActions(hand) {
  const preflop = preflopActions(hand);
  return preflop
    .split('\n') //split the preflop text into lines
    .map((line) => line.trim()) //remove extra spaces from each line
    .filter((line) => line) //remove empty lines
    .map((line) => {
      const match = line.match(/^(.+?): (folds|calls|raises|checks|bets)/); //matches lines like 'playerName: action' and removes other ones
      if (!match) return null; // if the line is not an action line, ignore it
      return {
        // create structured action object (get player name and action)
        player: match[1],
        action: match[2],
        raw: line,
      };
    })
    .filter((action) => action); //remove the null values from ignored lines
}

function parseHand(hand) {
  return {
    raw: hand,
    preflopActions: structuredPreFlopActions(hand),
  };
}

function parsePokerStarsFile(fileText) {
  const hands = getHands(fileText);
  const parsedHands = hands.map((hand) => parseHand(hand));
  return parsedHands;
}

const parsedHands = parsePokerStarsFile(fileText);

function getVPIP(parsedHands) {
  let vpipCount = 0;

  parsedHands.forEach((hand) => {
    const heroEnteredPot = hand.preflopActions.some((action) => {
      //“Does at least one item in this array satisfy the check below? If there is one like this then hero vpip
      return action.player === 'Hero' && (action.action === 'calls' || action.action === 'raises');
    });
    if (heroEnteredPot) vpipCount++;
    return {
      hands: parsedHands.length,
      vpipCount,
      vpip: Number(((vpipHands / parsedHands.length) * 100).toFixed(2)),
    };
  });
}
