import { parseHand } from '../parser.js';
import { REGEX } from './regex.js';

function cleanFileText(fileText) {
  return fileText.replace(/^\uFEFF/, '').replace(/Ã¯Â»Â¿/g, '');
}

function getGameType(headerText = '') {
  if (/holdem/i.test(headerText)) return "Hold'em No Limit";
  return headerText.split('-')[0]?.trim() || 'Unknown';
}

function getBlinds(headerText = '') {
  const match = headerText.match(/\((?:[$€£]?)([\d,.]+)\/(?:[$€£]?)([\d,.]+)\)/);

  return {
    smallBlind: match?.[1] || null,
    bigBlind: match?.[2] || null,
  };
}

function getCurrency(headerText = '') {
  if (headerText.includes('€')) return 'EUR';
  if (headerText.includes('£')) return 'GBP';
  if (headerText.includes('$')) return 'USD';
  return null;
}

function formatDate(dateText) {
  return dateText || '';
}

function cleanCards(cards = '') {
  return cards.trim().split(/\s+/).filter(Boolean).join(' ');
}

function getSeatPlayers(lines) {
  const seatPlayers = new Map();

  for (const line of lines) {
    const match = line.match(/^Seat (\d+): (.+?) \((?:[$€£]?)([\d,.]+) in chips\)/);

    if (match) {
      seatPlayers.set(Number(match[1]), match[2].trim());
    }
  }

  return seatPlayers;
}

function getTableName(headerText = '') {
  const tournamentMatch = headerText.match(/Tournament #(\d+).*?TBL#(\d+)/i);
  if (tournamentMatch) return `${tournamentMatch[1]}-${tournamentMatch[2]}`;

  const tableMatch = headerText.match(/TBL#?(\d+)/i);
  if (tableMatch) return tableMatch[1];

  return 'Bovada';
}

function getMaxPlayers(seatPlayers) {
  const seats = [...seatPlayers.keys()];
  return seats.length ? Math.max(...seats) : 6;
}

function getButtonSeat(lines) {
  for (const line of lines) {
    const match = line.match(/Set dealer\/Bring in spot \[(\d+)\]/i);
    if (match) return match[1];
  }

  return [...lines.join('\n').matchAll(/Seat #(\d+) is the button/gi)][0]?.[1] || null;
}

function normalizeActionLine(line) {
  let match;

  match = line.match(/^(.+?)\s*:\s*Ante\/Small blind ([$€£]?[\d,.]+)$/i);
  if (match) return `${match[1].trim()}: posts small blind ${match[2]}`;

  match = line.match(/^(.+?)\s*:\s*Small blind ([$€£]?[\d,.]+)$/i);
  if (match) return `${match[1].trim()}: posts small blind ${match[2]}`;

  match = line.match(/^(.+?)\s*:\s*Big blind\/Bring in ([$€£]?[\d,.]+)$/i);
  if (match) return `${match[1].trim()}: posts big blind ${match[2]}`;

  match = line.match(/^(.+?)\s*:\s*Big blind ([$€£]?[\d,.]+)$/i);
  if (match) return `${match[1].trim()}: posts big blind ${match[2]}`;

  match = line.match(/^(.+?)\s*:\s*Posts ante ([$€£]?[\d,.]+)$/i);
  if (match) return `${match[1].trim()}: posts ante ${match[2]}`;

  match = line.match(/^(.+?)\s*:\s*(Folds|Checks)$/i);
  if (match) return `${match[1].trim()}: ${match[2].toLowerCase()}`;

  match = line.match(/^(.+?)\s*:\s*Call ([$€£]?[\d,.]+)$/i);
  if (match) return `${match[1].trim()}: calls ${match[2]}`;

  match = line.match(/^(.+?)\s*:\s*Bets ([$€£]?[\d,.]+)(?: \[all in\])?$/i);
  if (match) return `${match[1].trim()}: bets ${match[2]}${/\[all in\]/i.test(line) ? ' and is all-in' : ''}`;

  match = line.match(/^(.+?)\s*:\s*Raises ([$€£]?[\d,.]+) to ([$€£]?[\d,.]+)$/i);
  if (match) return `${match[1].trim()}: raises ${match[2]} to ${match[3]}`;

  match = line.match(/^(.+?)\s*:\s*All-in\(raise\) ([$€£]?[\d,.]+) to ([$€£]?[\d,.]+)$/i);
  if (match) return `${match[1].trim()}: raises ${match[2]} to ${match[3]} and is all-in`;

  match = line.match(/^(.+?)\s*:\s*All-in ([$€£]?[\d,.]+)$/i);
  if (match) return `${match[1].trim()}: bets ${match[2]} and is all-in`;

  match = line.match(/^(.+?)\s*:\s*Return uncalled portion of bet ([$€£]?[\d,.]+)$/i);
  if (match) return `Uncalled bet (${match[2]}) returned to ${match[1].trim()}`;

  match = line.match(/^(.+?)\s*:\s*Does not show \[([^\]]+)\](?: \((.+)\))?$/i);
  if (match) return `${match[1].trim()}: doesn't show hand`;

  match = line.match(/^(.+?)\s*:\s*Shows \[([^\]]+)\](?: \((.+)\))?$/i);
  if (match) return `${match[1].trim()}: shows [${cleanCards(match[2])}]${match[3] ? ` (${match[3]})` : ''}`;

  match = line.match(/^(.+?)\s*:\s*Hand Result ([$€£]?[\d,.]+)$/i);
  if (match) return `${match[1].trim()} collected ${match[2]} from pot`;

  return null;
}

function normalizeStreetLine(line) {
  let match;

  match = line.match(/^\*\*\* FLOP \*\*\* \[([^\]]+)\]$/i);
  if (match) return `*** FLOP *** [${cleanCards(match[1])}]`;

  match = line.match(/^\*\*\* TURN \*\*\* \[[^\]]+\] \[([^\]]+)\]$/i);
  if (match) return `*** TURN *** [${cleanCards(match[1])}]`;

  match = line.match(/^\*\*\* RIVER \*\*\* \[[^\]]+\] \[([^\]]+)\]$/i);
  if (match) return `*** RIVER *** [${cleanCards(match[1])}]`;

  return line;
}

function normalizeSummaryLine(line, seatPlayers) {
  let match;

  match = line.match(/^Total Pot\(([$€£]?[\d,.]+)\)$/i);
  if (match) return `Total pot ${match[1]} | Rake 0`;

  match = line.match(/^Board \[([^\]]*)\]$/i);
  if (match) return `Board [${cleanCards(match[1])}]`;

  match = line.match(/^Seat\+(\d+): (.+?) Folded before the FLOP$/i);
  if (match) return `Seat ${match[1]}: ${seatPlayers.get(Number(match[1])) || match[2].trim()} folded before Flop`;

  match = line.match(/^Seat\+(\d+): (.+?) ([$€£]?[\d,.]+) \[Does not show\]$/i);
  if (match) return `Seat ${match[1]}: ${seatPlayers.get(Number(match[1])) || match[2].trim()} collected (${match[3]})`;

  match = line.match(/^Seat\+(\d+): (.+?) ([$€£]?[\d,.]+) \[Showed \[([^\]]+)\](?: - (.+))?\]$/i);
  if (match) {
    return `Seat ${match[1]}: ${seatPlayers.get(Number(match[1])) || match[2].trim()} showed [${cleanCards(
      match[4],
    )}] and won (${match[3]}) with ${match[5] || 'unknown'}`;
  }

  return null;
}

function normalizeHand(handText) {
  const cleanedHandText = cleanFileText(handText);
  const lines = cleanedHandText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const header = lines.find((line) => /^(?:Bovada|Ignition|Bodog) Hand #/i.test(line));
  const headerMatch = header?.match(
    /^(?:Bovada|Ignition|Bodog) Hand #(\d+):\s*(.+?) - (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/i,
  );

  if (!headerMatch) {
    return null;
  }

  const [, handNumber, headerText, dateText] = headerMatch;
  const seatPlayers = getSeatPlayers(lines);
  const buttonSeat = getButtonSeat(lines);
  const { smallBlind, bigBlind } = getBlinds(headerText);

  if (!smallBlind || !bigBlind || !buttonSeat) {
    return null;
  }

  const currency = getCurrency(headerText);
  const normalizedLines = [
    `Bovada Hand #${handNumber}: ${getGameType(headerText)} (${smallBlind}/${bigBlind}${currency ? ` ${currency}` : ''}) - ${formatDate(
      dateText,
    )}`,
    `Table '${getTableName(headerText)}' ${getMaxPlayers(seatPlayers)}-max Seat #${buttonSeat} is the button`,
  ];

  let inSummary = false;
  let sawShowdown = false;

  for (const line of lines) {
    let match;

    if (
      line === header ||
      /Table enter user/i.test(line) ||
      /Draw for dealer/i.test(line) ||
      /Set dealer\/Bring in spot/i.test(line)
    ) {
      continue;
    }

    match = line.match(/^Seat (\d+): (.+?) \((?:[$€£]?)([\d,.]+) in chips\)/);
    if (match) {
      normalizedLines.push(`Seat ${match[1]}: ${match[2].trim()} (${match[3]} in chips)`);
      continue;
    }

    if (/^\*\*\* HOLE CARDS \*\*\*$/i.test(line)) {
      normalizedLines.push('*** HOLE CARDS ***');
      continue;
    }

    match = line.match(/^(.+?)\s*:\s*Card dealt to a spot \[([^\]]+)\]$/i);
    if (match) {
      const player = match[1].trim();
      if (player.includes('[ME]')) {
        normalizedLines.push(`Dealt to ${player} [${cleanCards(match[2])}]`);
      }
      continue;
    }

    if (/^\*\*\* SHOW ?DOWN \*\*\*$/i.test(line)) {
      sawShowdown = true;
      normalizedLines.push('*** SHOW DOWN ***');
      continue;
    }

    if (/^\*\*\* SUMMARY \*\*\*$/i.test(line)) {
      inSummary = true;
      if (!sawShowdown) {
        normalizedLines.push('*** SHOW DOWN ***');
      }
      normalizedLines.push('*** SUMMARY ***');
      continue;
    }

    if (inSummary) {
      const summaryLine = normalizeSummaryLine(line, seatPlayers);
      if (summaryLine) normalizedLines.push(summaryLine);
      continue;
    }

    const streetLine = normalizeStreetLine(line);
    if (streetLine !== line) {
      normalizedLines.push(streetLine);
      continue;
    }

    const actionLine = normalizeActionLine(line);
    if (actionLine) normalizedLines.push(actionLine);
  }

  return normalizedLines.join('\n');
}

export function splitHands(fileText) {
  return cleanFileText(fileText)
    .split(/(?=^(?:Bovada|Ignition|Bodog) Hand #)/m)
    .map((handText) => handText.trim())
    .filter((handText) => /^(?:Bovada|Ignition|Bodog) Hand #/.test(handText));
}

export function parseBovada(fileText) {
  const handTexts = splitHands(fileText);
  const hands = [];

  for (const handText of handTexts) {
    const normalizedHand = normalizeHand(handText);

    if (normalizedHand) {
      hands.push(parseHand(normalizedHand, REGEX));
    }
  }

  return hands;
}
