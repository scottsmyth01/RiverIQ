import { parseActions } from './helpers/parseActions.js';
import { parseStreet } from './helpers/parseStreet.js';
import { parseGGPoker } from './ggpoker/wrapper.js';
import { gg_hands as fileText } from './ggpoker/ggpoker_150_hands_sample.js';

export function parseFile(fileText, regex) {
  const handTexts = splitHands(fileText);
  return handTexts.map((handText) => parseHand(handText, regex));
}

export function getPositions(handText) {
  const positionMaps = {
    2: ['BTN', 'BB'],
    3: ['BTN', 'SB', 'BB'],
    4: ['BTN', 'SB', 'BB', 'CO'],
    5: ['BTN', 'SB', 'BB', 'UTG', 'CO'],
    6: ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'],
    7: ['BTN', 'SB', 'BB', 'UTG', 'MP', 'HJ', 'CO'],
    8: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'HJ', 'CO'],
    9: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO'],
  };
  const sortedPlayers = [...(handText.players || [])].sort((a, b) => a.seat - b.seat);
  const buttonIndex = sortedPlayers.findIndex((player) => player.seat === handText.buttonSeat);
  if (buttonIndex === -1) {
    return handText;
  }
  // Rotate so the button is first
  const orderedPlayers = [...sortedPlayers.slice(buttonIndex), ...sortedPlayers.slice(0, buttonIndex)];
  const positions = positionMaps[orderedPlayers.length];
  if (!positions) {
    throw new Error(`Unsupported table size: ${orderedPlayers.length}`);
  }
  orderedPlayers.forEach((player, index) => {
    player.position = positions[index];
  });
  handText.players = orderedPlayers;
  const hero = handText.players.find((player) => player.name === handText.hero.name);
  handText.position = hero?.position ?? null;
  return handText;
}

export function getHandNumber(handText, regex) {
  const match = handText.match(regex);
  if (!match) {
    return null;
  }
  return match[1];
}

export function getTableInfo(handText, regex) {
  const headerMatch = handText.match(regex.tableHeader);
  const tableMatch = handText.match(regex.table);
  return {
    game: headerMatch ? headerMatch[1] : null,
    smallBlind: headerMatch ? Number(headerMatch[2]) : null,
    bigBlind: headerMatch ? Number(headerMatch[3]) : null,
    currency: headerMatch && headerMatch[4] ? headerMatch[4] : null,
    maxPlayers: tableMatch ? Number(tableMatch[1]) : null,
  };
}

export function getPlayers(handText, regex) {
  const players = [];
  const seatRegex = regex;
  let match;
  while ((match = seatRegex.exec(handText)) !== null) {
    players.push({
      seat: Number(match[1]),
      name: match[2],
      stack: Number(match[3]),
    });
  }
  return players;
}

export function getButtonSeat(handText, regex) {
  const match = handText.match(regex);
  return match ? Number(match[1]) : null;
}

export function getHero(handText, regex) {
  const lines = handText.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(regex);

    if (match) {
      return {
        name: match[1],
        cards: match[2].split(' '),
      };
    }
  }

  return null;
}

export function getPreflop(handText, preflopRegex) {
  const match = handText.match(preflopRegex);

  if (!match) {
    return null;
  }

  const actionLines = match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return {
    actions: parseActions(actionLines),
  };
}

export function parseHand(handText, regex) {
  let hand = {
    handNumber: getHandNumber(handText, regex.handNumber),
    table: getTableInfo(handText, regex),
    players: getPlayers(handText, regex.players),
    hero: getHero(handText, regex.hero),
    buttonSeat: getButtonSeat(handText, regex.buttonSeat),
  };
  hand = getPositions(hand);
  hand.preflop = getPreflop(handText, regex.preflop);
  // hand.flop = getFlop(handText);
  // hand.turn = getTurn(handText);
  // hand.river = getRiver(handText);
  // hand.showdown = getShowdown(handText);
  // hand.summary = getSummary(handText);
  return hand;
}

console.log(parseGGPoker(fileText));
