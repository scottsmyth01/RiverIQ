import { parseHand } from '../parser.js';
import { normalizeFileText } from '../helpers/normalizeFileText.js';
import { REGEX } from './regex.js';

const MONTHS = {
  january: '01',
  february: '02',
  march: '03',
  april: '04',
  may: '05',
  june: '06',
  july: '07',
  august: '08',
  september: '09',
  october: '10',
  november: '11',
  december: '12',
};

function getCurrency(symbolOrCode) {
  if (symbolOrCode === '€' || symbolOrCode === 'EUR') return 'EUR';
  if (symbolOrCode === '£' || symbolOrCode === 'GBP') return 'GBP';
  return 'USD';
}

function cleanAmount(amount = '') {
  return amount.replace(/\s*(USD|CAD|EUR|GBP)\b/i, '').trim();
}

function cleanCards(cards = '') {
  return cards
    .split(',')
    .map((card) => card.trim())
    .filter(Boolean)
    .join(' ');
}

function formatDate(monthName, day, year, time) {
  const month = MONTHS[monthName.toLowerCase()];
  return `${year}-${month}-${day.padStart(2, '0')} ${time}`;
}

function normalizeActionLine(rawLine) {
  const line = rawLine.replace(/\.$/, '');
  let match;

  match = line.match(/^(.+?) posts (small blind|big blind|ante) \[([^\]]+)\]$/i);
  if (match) return `${match[1]}: posts ${match[2]} ${cleanAmount(match[3])}`;

  match = line.match(/^(.+?) (folds|checks)$/i);
  if (match) return `${match[1]}: ${match[2].toLowerCase()}`;

  match = line.match(/^(.+?) (bets|calls|raises) \[([^\]]+)\]( and is all-in)?$/i);
  if (match) return `${match[1]}: ${match[2].toLowerCase()} ${cleanAmount(match[3])}${match[4] || ''}`;

  match = line.match(/^Uncalled bet \[([^\]]+)\] returned to (.+)$/i);
  if (match) return `Uncalled bet (${cleanAmount(match[1])}) returned to ${match[2]}`;

  match = line.match(/^(.+?) shows \[([^\]]+)\]$/i);
  if (match) return `${match[1]}: shows [${cleanCards(match[2])}]`;

  match = line.match(/^(.+?) wins ([$€£]?[\d,.]+)(?:\s+\w+)? from (?:the )?(.*?pot)$/i);
  if (match) return `${match[1]} collected ${match[2]} from ${match[3]}`;

  return line;
}

function normalizeSummaryLine(line) {
  let match;

  match = line.match(/^Board \[([^\]]+)\]$/i);
  if (match) return `Board [${cleanCards(match[1])}]`;

  match = line.match(/^Seat (\d+): (.+?) showed \[([^\]]+)\] and won \[ ([^\]]+) \]$/i);
  if (match) return `Seat ${match[1]}: ${match[2]} showed [${cleanCards(match[3])}] and collected (${cleanAmount(match[4])})`;

  match = line.match(/^Seat (\d+): (.+?) showed \[([^\]]+)\] and lost$/i);
  if (match) return `Seat ${match[1]}: ${match[2]} showed [${cleanCards(match[3])}] and lost with unknown`;

  match = line.match(/^Seat (\d+): (.+?) collected \[ ([^\]]+) \]$/i);
  if (match) return `Seat ${match[1]}: ${match[2]} collected (${cleanAmount(match[3])})`;

  return line;
}

function normalizeHand(handText) {
  const handNumber = handText.match(/^\*{5} Hand History for Game (\d+) \*{5}$/m)?.[1] || handText.match(/^Game #(\d+) starts\./m)?.[1];
  const header = handText.match(
    /^([$€£]?)([\d,.]+)\/([$€£]?)([\d,.]+) NL Texas Hold'em - \w+, ([A-Za-z]+) (\d{1,2}), (\d{4}) ([\d:]+)(?: \w+)?$/m,
  );
  const table = handText.match(/^Table (.+?) (\d+) Max \(Real Money\)$/m);
  const buttonSeat = handText.match(/^Seat (\d+) is the button$/m)?.[1];

  if (!handNumber || !header || !table || !buttonSeat) {
    return null;
  }

  const [, smallBlindSymbol, smallBlind, bigBlindSymbol, bigBlind, monthName, day, year, time] = header;
  const [, tableName, maxPlayers] = table;
  const currency = getCurrency(smallBlindSymbol || bigBlindSymbol);
  const normalizedLines = [
    `partypoker Hand #${handNumber}: Hold'em No Limit (${smallBlind}/${bigBlind} ${currency}) - ${formatDate(monthName, day, year, time)}`,
    `Table '${tableName}' ${maxPlayers}-max Seat #${buttonSeat} is the button`,
  ];

  for (const rawLine of handText.split(/\r?\n/)) {
    const line = rawLine.trim();
    let match;

    if (
      !line ||
      line.startsWith('Game #') ||
      line.startsWith('*****') ||
      line.includes("NL Texas Hold'em") ||
      line.startsWith('Table ') ||
      line.includes(' is the button') ||
      line.startsWith('Total number of players')
    ) {
      continue;
    }

    match = line.match(/^Seat (\d+): (.+?) \( ([$€£]?)([\d,.]+) ([A-Z]+) \)$/);
    if (match) {
      normalizedLines.push(`Seat ${match[1]}: ${match[2]} ($${match[4]} in chips)`);
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
  return normalizeFileText(fileText)
    .split(/(?=^Game #\d+ starts\.)/m)
    .map((handText) => handText.trim())
    .filter((handText) => /^Game #\d+ starts\./.test(handText));
}

export function parsePartyPoker(fileText) {
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
