import { parseHand } from '../parser.js';
import { REGEX } from './regex.js';

function getCurrency(symbol) {
  if (symbol === '€') return 'EUR';
  if (symbol === '£') return 'GBP';
  return 'USD';
}

function cleanCards(cards = '') {
  return cards
    .split(',')
    .map((card) => card.trim())
    .filter(Boolean)
    .join(' ');
}

function formatDate(day, month, year, time) {
  return `${year}-${month}-${day} ${time}`;
}

function normalizeActionLine(line) {
  let match;

  match = line.match(/^(.+?) posts (small blind|big blind|ante) \[([^\]]+)\]$/i);
  if (match) return `${match[1]}: posts ${match[2]} ${match[3].trim()}`;

  match = line.match(/^(.+?) (folds|checks)$/i);
  if (match) return `${match[1]}: ${match[2].toLowerCase()}`;

  match = line.match(/^(.+?) (bets|calls|raises) \[([^\]]+)\]( and is all-in)?$/i);
  if (match) return `${match[1]}: ${match[2].toLowerCase()} ${match[3].trim()}${match[4] || ''}`;

  match = line.match(/^Uncalled bet \[([^\]]+)\] returned to (.+)$/i);
  if (match) return `Uncalled bet (${match[1].trim()}) returned to ${match[2]}`;

  match = line.match(/^(.+?) shows \[([^\]]+)\]$/i);
  if (match) return `${match[1]}: shows [${cleanCards(match[2])}]`;

  match = line.match(/^(.+?) wins ([^\s]+)$/i);
  if (match) return `${match[1]} collected ${match[2]} from pot`;

  return line;
}

function normalizeSummaryLine(line) {
  let match;

  match = line.match(/^Board \[([^\]]+)\]$/i);
  if (match) return `Board [${cleanCards(match[1])}]`;

  match = line.match(/^Seat (\d+): (.+?) showed \[([^\]]+)\] and won \[ ([^\]]+) \]$/i);
  if (match) return `Seat ${match[1]}: ${match[2]} showed [${cleanCards(match[3])}] and collected (${match[4].trim()})`;

  match = line.match(/^Seat (\d+): (.+?) showed \[([^\]]+)\] and lost$/i);
  if (match) return `Seat ${match[1]}: ${match[2]} showed [${cleanCards(match[3])}] and lost with unknown`;

  match = line.match(/^Seat (\d+): (.+?) collected \[ ([^\]]+) \]$/i);
  if (match) return `Seat ${match[1]}: ${match[2]} collected (${match[3].trim()})`;

  return line;
}

function normalizeHand(handText) {
  const handNumber = handText.match(/^#Game No\s*:\s*(\d+)/m)?.[1];
  const header = handText.match(/^([$€£]?)([\d,.]+)\/([$€£]?)([\d,.]+) Blinds No Limit Holdem - \*\*\* (\d{2}) (\d{2}) (\d{4}) ([\d:]+)/m);
  const table = handText.match(/(?:^| - )Table (.+?) (\d+) Max \(Real Money\)$/m);
  const buttonSeat = handText.match(/^Seat (\d+) is the button$/m)?.[1];

  if (!handNumber || !header || !table || !buttonSeat) {
    return null;
  }

  const [, smallBlindSymbol, smallBlind, bigBlindSymbol, bigBlind, day, month, year, time] = header;
  const [, tableName, maxPlayers] = table;
  const currency = getCurrency(smallBlindSymbol || bigBlindSymbol);
  const normalizedLines = [
    `888poker Hand #${handNumber}: Hold'em No Limit (${smallBlind}/${bigBlind} ${currency}) - ${formatDate(day, month, year, time)}`,
    `Table '${tableName}' ${maxPlayers}-max Seat #${buttonSeat} is the button`,
  ];

  const rawLines = handText.split(/\r?\n/);

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    let match;

    if (
      !line ||
      line.startsWith('#Game No') ||
      line.startsWith('*****') ||
      line.startsWith('$') ||
      line.startsWith('Table ') ||
      line.includes(' is the button') ||
      line.startsWith('Total number of players')
    ) {
      continue;
    }

    match = line.match(/^Seat (\d+): (.+?) \( \$?([\d,.]+) \)$/);
    if (match) {
      normalizedLines.push(`Seat ${match[1]}: ${match[2]} ($${match[3]} in chips)`);
      continue;
    }

    match = line.match(/^Dealt to (.+?) \[([^\]]+)\]$/);
    if (match) {
      normalizedLines.push(`Dealt to ${match[1]} [${cleanCards(match[2])}]`);
      continue;
    }

    match = line.match(/^\*\* Dealing down cards \*\*$/i);
    if (match) {
      normalizedLines.push('*** HOLE CARDS ***');
      continue;
    }

    match = line.match(/^\*\* Dealing Flop \*\* \[([^\]]+)\]$/i);
    if (match) {
      normalizedLines.push(`*** FLOP *** [${cleanCards(match[1])}]`);
      continue;
    }

    match = line.match(/^\*\* Dealing Turn \*\* \[([^\]]+)\]$/i);
    if (match) {
      normalizedLines.push(`*** TURN *** [${cleanCards(match[1])}]`);
      continue;
    }

    match = line.match(/^\*\* Dealing River \*\* \[([^\]]+)\]$/i);
    if (match) {
      normalizedLines.push(`*** RIVER *** [${cleanCards(match[1])}]`);
      continue;
    }

    if (/^\*\* Showdown \*\*$/i.test(line)) {
      normalizedLines.push('*** SHOW DOWN ***');
      continue;
    }

    if (/^\*\* Summary \*\*$/i.test(line)) {
      normalizedLines.push('*** SUMMARY ***');
      continue;
    }

    normalizedLines.push(normalizeSummaryLine(normalizeActionLine(line)));
  }

  return normalizedLines.join('\n');
}

export function splitHands(fileText) {
  return fileText
    .split(/(?=^#Game No\s*:)/m)
    .map((handText) => handText.trim())
    .filter((handText) => /^#Game No\s*:/.test(handText));
}

export function parse888Poker(fileText) {
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
