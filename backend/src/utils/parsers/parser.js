import { parseActions } from './helpers/parseActions.js';
import { parseStreet } from './helpers/parseStreet.js';
import { parseShowdownActions } from './helpers/parseShowdownActions.js';
import { parseSummarySeat } from './helpers/parseSummarySeat.js';
import { getFirstAmount, MONEY_PATTERN } from './helpers/amounts.js';

export function parseFile(fileText, regex) {
  const handTexts = splitHands(fileText);
  return handTexts.map((handText) => parseHand(handText, regex));
}

export function getPositions(handText) {
  const positionMaps = {
    2: ['BTN', 'BB'],
    3: ['SB', 'BB', 'BTN'],
    4: ['SB', 'BB', 'UTG', 'BTN'],
    5: ['SB', 'BB', 'UTG', 'CO', 'BTN'],
    6: ['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN'],
    7: ['SB', 'BB', 'UTG', 'LJ', 'HJ', 'CO', 'BTN'],
    8: ['SB', 'BB', 'UTG', 'UTG+1', 'LJ', 'HJ', 'CO', 'BTN'],
    9: ['SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN'],
  };
  const sortedPlayers = [...(handText.players || [])].sort((a, b) => a.seat - b.seat);

  if (!sortedPlayers.length || !handText.buttonSeat) {
    return handText;
  }

  let startIndex = sortedPlayers.findIndex((player) => player.seat > handText.buttonSeat);

  if (startIndex === -1) {
    startIndex = 0;
  }

  if (sortedPlayers.length === 2) {
    const buttonIndex = sortedPlayers.findIndex((player) => player.seat === handText.buttonSeat);
    if (buttonIndex !== -1) {
      startIndex = buttonIndex;
    }
  }

  const orderedPlayers = [...sortedPlayers.slice(startIndex), ...sortedPlayers.slice(0, startIndex)];
  const positions = positionMaps[orderedPlayers.length];
  if (!positions) {
    throw new Error(`Unsupported table size: ${orderedPlayers.length}`);
  }
  orderedPlayers.forEach((player, index) => {
    player.position = positions[index];
  });
  handText.players = orderedPlayers;
  const hero = handText.hero ? handText.players.find((player) => player.name === handText.hero.name) : null;
  handText.heroPosition = hero?.position ?? null;
  handText.position = handText.heroPosition;

  if (handText.hero) {
    handText.hero = {
      ...handText.hero,
      seat: hero?.seat ?? null,
      position: handText.heroPosition,
    };
  }

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
  const headerMatch = regex.tableHeader ? handText.match(regex.tableHeader) : null;
  const headerLineMatch = regex.headerLine ? handText.match(regex.headerLine) : null;
  const blindsMatch = regex.blinds ? (headerLineMatch?.[1] || handText).match(regex.blinds) : null;
  const tableMatch = handText.match(regex.table);
  const gameText = headerLineMatch?.[1] || headerMatch?.[1] || null;

  return {
    game: gameText?.includes("Hold'em No Limit") ? "Hold'em No Limit" : gameText,
    smallBlind: blindsMatch ? Number(blindsMatch[1].replace(/,/g, '')) : headerMatch ? Number(headerMatch[2]) : null,
    bigBlind: blindsMatch ? Number(blindsMatch[2].replace(/,/g, '')) : headerMatch ? Number(headerMatch[3]) : null,
    currency: blindsMatch?.[3] || headerMatch?.[4] || regex.currency || null,
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
      stack: Number(match[3].replace(/,/g, '')),
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

  const forcedBetLines = handText
    .slice(0, match.index)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /:\s*posts\b/i.test(line));

  const actionLines = match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return {
    actions: parseActions([...forcedBetLines, ...actionLines]),
  };
}

export function getFlop(handText, flopRegex) {
  return parseStreet(handText, flopRegex);
}

export function getTurn(handText, turnRegex) {
  return parseStreet(handText, turnRegex, 'card');
}

export function getRiver(handText, riverRegex) {
  return parseStreet(handText, riverRegex, 'card');
}

export function getShowdown(handText, regex) {
  const match = handText.match(regex);

  if (!match) {
    return null;
  }

  const lines = match[1]
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return {
    actions: parseShowdownActions(lines),
  };
}

export function getSummary(handText, regex, options = {}) {
  const match = handText.match(regex);

  if (!match) {
    return null;
  }

  const lines = match[1]
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const summary = {
    totalPot: null,
    rake: null,
    pots: [],
    board: [],
    seats: [],
  };

  for (const line of lines) {
    let match;

    // Total pot $3.75 | Rake $0.10
    // Total pot $10.00 Main pot $4.00. Side pot $6.00. | Rake $0.50
    match = line.match(new RegExp(`^Total pot ${MONEY_PATTERN.source}(.*?)\\| Rake ${MONEY_PATTERN.source}`, 'i'));

    if (match) {
      summary.totalPot = getFirstAmount(match[1]);
      summary.rake = getFirstAmount(match[3]);
      summary.pots = [...match[2].matchAll(new RegExp(`(main pot|side pot(?:-?\\d+)?)\\s+${MONEY_PATTERN.source}`, 'gi'))].map(
        (potMatch) => ({
          type: potMatch[1].toLowerCase(),
          amount: getFirstAmount(potMatch[2]),
        }),
      );
      continue;
    }

    // Board [Qs 8h 4d 2h Tc]
    match = line.match(/^Board \[([^\]]+)\]/);

    if (match) {
      summary.board = match[1].trim().split(/\s+/);
      continue;
    }

    // Everything beginning with Seat ...
    if (line.startsWith('Seat ')) {
      summary.seats.push(parseSummarySeat(line));
    }
  }

  const collectedAmountsByPlayer = options.useCollectedAmounts ? getCollectedAmountsByPlayer(handText) : new Map();
  if (collectedAmountsByPlayer.size) {
    summary.seats = summary.seats.map((seat) => {
      if (!seat.player || !collectedAmountsByPlayer.has(seat.player)) return seat;

      return {
        ...seat,
        result: seat.result === 'lost' ? 'collected' : seat.result,
        amount: collectedAmountsByPlayer.get(seat.player),
      };
    });
  }

  return summary;
}

function getCollectedAmountsByPlayer(handText) {
  const amountsByPlayer = new Map();
  const collectedRegex = new RegExp(`^(.+?) collected ${MONEY_PATTERN.source} from (?:main |side )?pot$`, 'gim');
  let match;

  while ((match = collectedRegex.exec(handText)) !== null) {
    const player = match[1].trim();
    const amount = getFirstAmount(match[2]);

    if (!player || !Number.isFinite(amount)) continue;

    amountsByPlayer.set(player, Number(((amountsByPlayer.get(player) || 0) + amount).toFixed(2)));
  }

  return amountsByPlayer;
}

export function getDate(handText, regex) {
  const match = handText.match(regex);
  if (!match) {
    return null;
  }
  return new Date(match[1]);
}

export function parseHand(handText, regex) {
  let hand = {
    handNumber: getHandNumber(handText, regex.handNumber),
    table: getTableInfo(handText, regex),
    players: getPlayers(handText, regex.players),
    hero: getHero(handText, regex.hero),
    buttonSeat: getButtonSeat(handText, regex.buttonSeat),
    date: getDate(handText, regex.date),
  };
  hand = getPositions(hand);
  hand.preflop = getPreflop(handText, regex.preflop);
  hand.table = {
    ...hand.table,
    ante: getAnte(hand.preflop),
  };
  hand.flop = getFlop(handText, regex.flop);
  hand.turn = getTurn(handText, regex.turn);
  hand.river = getRiver(handText, regex.river);
  hand.showdown = getShowdown(handText, regex.showdown);
  hand.summary = getSummary(handText, regex.summary, regex);
  return hand;
}

function getAnte(preflop) {
  const anteAction = preflop?.actions?.find((action) => action.action === 'post' && action.blind === 'ante');

  return anteAction?.amount ?? null;
}
