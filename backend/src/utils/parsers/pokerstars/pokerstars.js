import { pokerstars_hands as fileText } from './pokerstars_150_hands.js';

function splitHands(file) {
  const hands = file.split(/(?=PokerStars Hand #)/).filter(Boolean);
  hands.shift();
  return hands;
}
export function parsePokerStars(fileText) {
  const handTexts = splitHands(fileText);

  const hands = [];

  for (const handText of handTexts) {
    let hand = parseHand(handText);
    hand = getPositions(hand);
    hands.push(hand);
  }

  return hands;
}
function getPositions(hand) {
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
  const sortedPlayers = [...(hand.players || [])].sort((a, b) => a.seat - b.seat);
  const buttonIndex = sortedPlayers.findIndex((player) => player.seat === hand.buttonSeat);
  if (buttonIndex === -1) {
    return hand;
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
  hand.players = orderedPlayers;
  const hero = hand.players.find((player) => player.name === hand.hero.name);
  hand.position = hero?.position ?? null;
  return hand;
}
function getHandNumber(handText) {
  const match = handText.match(/PokerStars Hand #(\d+)/);
  if (!match) {
    return null;
  }
  return match[1];
}
function getDate(handText) {
  const match = handText.match(/- (\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})/);
  if (!match) {
    return null;
  }
  return new Date(match[1].replace(/\//g, '-'));
}
function getTableInfo(handText) {
  const headerMatch = handText.match(/PokerStars Hand #\d+: (.+?) \(\$([\d.]+)\/\$([\d.]+) ([A-Z]+)\)/);
  const tableMatch = handText.match(/Table '.+?' (\d+)-max/);

  return {
    game: headerMatch ? headerMatch[1] : null,
    smallBlind: headerMatch ? Number(headerMatch[2]) : null,
    bigBlind: headerMatch ? Number(headerMatch[3]) : null,
    currency: headerMatch ? headerMatch[4] : null,
    maxPlayers: tableMatch ? Number(tableMatch[1]) : null,
  };
}
function getPlayers(hand) {
  const lines = hand.split(/\r?\n/);
  const players = [];
  for (const line of lines) {
    const match = line.match(/^Seat (\d+): (.+?) \(\$([\d.]+) in chips\)$/);
    if (!match) continue;

    players.push({
      seat: Number(match[1]),
      name: match[2],
      stack: Number(match[3]),
    });
  }
  return players;
}
function getButtonSeat(hand) {
  const lines = hand.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/Seat #(\d+) is the button/);
    if (match) {
      return Number(match[1]);
    }
  }
  return null;
}
function getHero(hand) {
  const lines = hand.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^Dealt to (.+?) \[([^\]]+)\]$/);

    if (match) {
      return {
        name: match[1],
        cards: match[2].split(' '),
      };
    }
  }

  return null;
}
function getBlinds(hand) {
  const lines = hand.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/\(\$([\d.]+)\/\$([\d.]+)/);

    if (match) {
      return {
        smallBlind: Number(match[1]),
        bigBlind: Number(match[2]),
      };
    }
  }

  return null;
}

export function getPreflopText(handText) {
  const match = handText.match(/\*\*\* HOLE CARDS \*\*\*([\s\S]*?)(?=\*\*\* FLOP \*\*\*|\*\*\* SUMMARY \*\*\*)/);
  if (!match) {
    return '';
  }
  return match[1].trim();
}

export function getPreflopActions(preflopText) {
  const actions = [];
  const lines = preflopText.split('\n');

  for (const line of lines) {
    const match = line.match(/^(.+?): (.+)$/);
    if (!match) continue;
    const player = match[1];
    const actionText = match[2];
    let action = null;
    let amount = null;

    if (actionText.startsWith('folds')) {
      action = 'fold';
    } else if (actionText.startsWith('checks')) {
      action = 'check';
    } else if (actionText.startsWith('calls')) {
      action = 'call';
      const m = actionText.match(/^calls \$([\d.]+)/);
      if (m) amount = Number(m[1]);
    } else if (actionText.startsWith('bets')) {
      action = 'bet';
      const m = actionText.match(/^bets \$([\d.]+)/);
      if (m) amount = Number(m[1]);
    } else if (actionText.startsWith('raises')) {
      action = 'raise';
      const m = actionText.match(/^raises \$[\d.]+ to \$([\d.]+)/);
      if (m) amount = Number(m[1]);
    } else if (actionText.startsWith('posts small blind')) {
      action = 'blind';
      blind = 'small';
      const m = actionText.match(/^posts small blind \$([\d.]+)/);
      if (m) amount = Number(m[1]);
    } else if (actionText.startsWith('posts big blind')) {
      action = 'blind';
      blind = 'big';
      const m = actionText.match(/^posts big blind \$([\d.]+)/);
      if (m) amount = Number(m[1]);
    }

    if (!action) continue;

    actions.push({
      player,
      action,
      amount,
      raw: line,
    });
  }

  return actions;
}

export function getPreflop(handText) {
  const text = getPreflopText(handText);
  const actions = getPreflopActions(text);

  return {
    text,
    actions,
  };
}

export function parseHand(handText) {
  let hand = {
    handNumber: getHandNumber(handText),
    date: getDate(handText),
    table: getTableInfo(handText),
    players: getPlayers(handText),
    hero: getHero(handText),
    buttonSeat: getButtonSeat(handText),
    blinds: getBlinds(handText),
  };
  hand = getPositions(hand);
  hand.preflop = getPreflop(handText);
  // hand.flop = getFlop(handText);
  // hand.turn = getTurn(handText);
  // hand.river = getRiver(handText);
  // hand.summary = getSummary(handText);
  return hand;
}

console.log(parsePokerStars(fileText));
