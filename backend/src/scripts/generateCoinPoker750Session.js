import { readFileSync, writeFileSync } from 'node:fs';
import { parseCoinPoker } from '../utils/parsers/coinpoker/wrapper.js';
import { calculateStats } from '../utils/parsers/stats/calculateStats.js';

const outputPath = process.env.OUTPUT_PATH || 'src/utils/parsers/fixtures/coinpoker/coinpoker_750_hand_target_session.txt';
const targetProfit = Number(process.env.TARGET_PROFIT ?? 145.59);
const handCount = Number(process.env.HAND_COUNT ?? 750);
const smallBlind = 0.25;
const bigBlind = 0.5;
const ante = 0.08;
const rake = 0.05;
const splashFee = 0.05;
const hero = 'Hero';
const seats = [
  { seat: 1, name: 'fletcherrrr', stack: 184.22 },
  { seat: 2, name: 'RiverJay', stack: 126.4 },
  { seat: 3, name: 'ButtonAce', stack: 96.15 },
  { seat: 4, name: hero, stack: 50 },
  { seat: 5, name: 'CutoffCat', stack: 112.3 },
  { seat: 6, name: 'BlindBea', stack: 88.45 },
];
const startTime = new Date(process.env.START_TIME ?? '2026-07-31T15:26:36-04:00');
const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const suits = ['s', 'h', 'd', 'c'];
const positionRanges = {
  UTG: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'AKo', 'AQo', 'AJo', 'KQo'],
  HJ: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s', '98s', 'AKo', 'AQo', 'AJo', 'ATo', 'KQo', 'KJo'],
  CO: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'KQs', 'KJs', 'KTs', 'K9s', 'QJs', 'QTs', 'Q9s', 'JTs', 'J9s', 'T9s', '98s', '87s', '76s', 'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'KQo', 'KJo', 'QJo'],
  BTN: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s', 'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'QJs', 'QTs', 'Q9s', 'Q8s', 'JTs', 'J9s', 'J8s', 'T9s', 'T8s', '98s', '97s', '87s', '86s', '76s', '75s', '65s', '54s', 'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'KQo', 'KJo', 'KTo', 'QJo', 'QTo', 'JTo'],
  SB: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s', 'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'QJs', 'QTs', 'Q9s', 'JTs', 'J9s', 'T9s', '98s', '87s', 'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'KQo', 'KJo', 'QJo'],
};
positionRanges.BB = positionRanges.HJ;

const positionByButton = {
  1: 'UTG',
  2: 'BB',
  3: 'SB',
  4: 'BTN',
  5: 'CO',
  6: 'HJ',
};
const blindsByButton = {
  1: { sb: 2, bb: 3 },
  2: { sb: 3, bb: 4 },
  3: { sb: 4, bb: 5 },
  4: { sb: 5, bb: 6 },
  5: { sb: 6, bb: 1 },
  6: { sb: 1, bb: 2 },
};
const orderByButton = {
  1: [4, 5, 6, 1, 2, 3],
  2: [5, 6, 1, 2, 3, 4],
  3: [6, 1, 2, 3, 4, 5],
  4: [1, 2, 3, 4, 5, 6],
  5: [2, 3, 4, 5, 6, 1],
  6: [3, 4, 5, 6, 1, 2],
};

let seed = 20260731;
function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 32;
}
function pick(items) {
  return items[Math.floor(random() * items.length)];
}
function money(amount) {
  return `₮${amount.toFixed(2)}`;
}
function formatDate(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} EDT`;
}
function cardCode(rank, suit) {
  return `${rank}${suit}`;
}
function comboToCards(combo) {
  const deck = new Set();
  if (combo[0] === combo[1]) {
    const shuffledSuits = [...suits].sort(() => random() - 0.5);
    return [cardCode(combo[0], shuffledSuits[0]), cardCode(combo[1], shuffledSuits[1])];
  }
  const suited = combo.endsWith('s');
  const first = combo[0];
  const second = combo[1];
  const firstSuit = pick(suits);
  const secondSuit = suited ? firstSuit : pick(suits.filter((suit) => suit !== firstSuit));
  const cards = [cardCode(first, firstSuit), cardCode(second, secondSuit)];
  cards.forEach((card) => deck.add(card));
  return cards;
}
function freshDeck(used = []) {
  const usedSet = new Set(used);
  return ranks.flatMap((rank) => suits.map((suit) => `${rank}${suit}`)).filter((card) => !usedSet.has(card));
}
function draw(deck, count) {
  const cards = [];
  for (let index = 0; index < count; index++) {
    const cardIndex = Math.floor(random() * deck.length);
    cards.push(deck.splice(cardIndex, 1)[0]);
  }
  return cards;
}
function uniqueHeroCards(position, index) {
  const range = positionRanges[position] || positionRanges.BTN;
  return comboToCards(range[index % range.length]);
}
function nameForSeat(seat) {
  return seats.find((player) => player.seat === seat).name;
}
function summaryLineForSeat({ seat, folded = true, shownCards = null, wonAmount = null }) {
  const name = nameForSeat(seat);
  if (shownCards && wonAmount !== null) return `Seat ${seat}: ${name} showed [${shownCards.join(' ')}] and won (${money(wonAmount)})`;
  if (shownCards) return `Seat ${seat}: ${name} showed [${shownCards.join(' ')}] and lost with high card`;
  return `Seat ${seat}: ${name} folded before Flop${folded ? " (didn't bet)" : ''}`;
}

const plan = [];
plan.push(...Array.from({ length: 95 }, () => 'open'));
plan.push(...Array.from({ length: 30 }, () => 'call'));
plan.push(...Array.from({ length: 22 }, () => 'threebet'));
plan.push(...Array.from({ length: 2 }, () => 'allin'));
plan.push(...Array.from({ length: 250 }, () => 'foldFacingOpen'));
plan.push(...Array.from({ length: 30 }, () => 'openFoldToThreeBet'));
plan.push(...Array.from({ length: 22 }, () => 'openCallThreeBet'));
plan.push(...Array.from({ length: 3 }, () => 'fourbet'));
plan.push(...Array.from({ length: 120 }, () => 'stealFold'));
plan.push(...Array.from({ length: 176 }, () => 'foldLimped'));
plan.sort(() => random() - 0.5);

const handProfits = [];
const lines = [];

for (let index = 0; index < handCount; index++) {
  const buttonSeat = (index % 6) + 1;
  const heroPosition = positionByButton[buttonSeat];
  const blinds = blindsByButton[buttonSeat];
  const handNumber = 101935600000 + index;
  const date = new Date(startTime.getTime() + index * 78_000);
  const heroCards = uniqueHeroCards(heroPosition, index);
  const deck = freshDeck(heroCards);
  const board = draw(deck, 5);
  const oppCards = draw(deck, 2);
  const type = plan[index];
  const inBlind = blinds.sb === 4 ? smallBlind : blinds.bb === 4 ? bigBlind : 0;
  let invested = ante + inBlind;
  let won = 0;
  let totalPot = 6 * ante + smallBlind + bigBlind;
  let showHero = false;
  let showOpponent = false;
  let opponentWinner = null;
  const preflopActions = [];
  const flopActions = [];
  const turnActions = [];
  const riverActions = [];
  const showdownActions = [];

  const addFoldAroundHero = () => {
    for (const seat of orderByButton[buttonSeat]) {
      const name = nameForSeat(seat);
      if (seat === 4) continue;
      preflopActions.push(`${name}: folds`);
    }
  };

  if (type === 'open') {
    const raiseTo = heroPosition === 'SB' ? 1.5 : 1.25;
    invested += raiseTo - inBlind;
    totalPot += raiseTo - inBlind;
    for (const seat of orderByButton[buttonSeat]) {
      const name = nameForSeat(seat);
      if (seat === 4) {
        preflopActions.push(`${hero}: raises ${money(raiseTo - inBlind)} to ${money(raiseTo)}`);
      } else if (random() < 0.32 && !flopActions.length) {
        preflopActions.push(`${name}: calls ${money(Math.max(raiseTo - (seat === blinds.bb ? bigBlind : seat === blinds.sb ? smallBlind : 0), 0))}`);
        totalPot += Math.max(raiseTo - (seat === blinds.bb ? bigBlind : seat === blinds.sb ? smallBlind : 0), 0);
        const cbet = index % 10 < 7;
        const flopCalled = cbet && index % 7 < 3;
        const showdown = index % 11 < 3;
        flopActions.push(cbet ? `${hero}: bets ${money(2)}` : `${hero}: checks`);
        if (cbet) {
          invested += 2;
          totalPot += 2;
          flopActions.push(flopCalled ? `${name}: calls ${money(2)}` : `${name}: folds`);
          if (flopCalled) totalPot += 2;
        } else {
          flopActions.push(`${name}: checks`);
        }
        if (flopCalled) {
          if (index % 2 === 0) {
            turnActions.push(`${hero}: bets ${money(4)}`);
            invested += 4;
            totalPot += 4;
            if (index % 4 === 0) {
              turnActions.push(`${name}: folds`);
              won = totalPot - rake;
            } else {
              turnActions.push(`${name}: calls ${money(4)}`);
              totalPot += 4;
              riverActions.push(`${hero}: checks`);
              riverActions.push(`${name}: checks`);
              showHero = true;
              showOpponent = true;
              won = index % 6 === 0 ? totalPot - rake : 0;
              opponentWinner = won ? null : name;
            }
          } else {
            turnActions.push(`${hero}: checks`);
            turnActions.push(`${name}: checks`);
            if (showdown || index % 3 === 0) {
              riverActions.push(`${hero}: checks`);
              riverActions.push(`${name}: checks`);
              showHero = true;
              showOpponent = true;
              won = index % 5 === 0 ? totalPot - rake : 0;
              opponentWinner = won ? null : name;
            }
          }
        }
        if (showdown) {
          if (won || opponentWinner) {
            // resolved on the turn/river branch above
          } else if (cbet && !flopCalled) {
            won = totalPot - rake;
          } else {
            turnActions.push(`${hero}: checks`);
            turnActions.push(`${name}: checks`);
            riverActions.push(`${hero}: checks`);
            riverActions.push(`${name}: checks`);
            showHero = true;
            showOpponent = true;
            won = index % 2 === 0 ? totalPot - rake : 0;
            opponentWinner = won ? null : name;
          }
        } else if (cbet && index % 7 >= 3) {
          won = totalPot - rake;
        }
      } else {
        preflopActions.push(`${name}: folds`);
      }
    }
    if (!flopActions.length) {
      const returnAmount = Math.max(raiseTo - (blinds.bb === 4 ? bigBlind : 0), 0.25);
      preflopActions.push(`${hero}: RETURN ${money(returnAmount)}`);
      invested -= returnAmount;
      totalPot -= returnAmount;
      won = totalPot - splashFee;
    }
  } else if (type === 'call') {
    const opener = nameForSeat(orderByButton[buttonSeat].find((seat) => seat !== 4));
    preflopActions.push(`${opener}: raises ${money(1)} to ${money(1.5)}`);
    totalPot += 1.5 - (blinds.bb === seats.find((p) => p.name === opener)?.seat ? bigBlind : 0);
    for (const seat of orderByButton[buttonSeat]) {
      const name = nameForSeat(seat);
      if (name === opener) continue;
      if (seat === 4) {
        const callAmount = 1.5 - inBlind;
        preflopActions.push(`${hero}: calls ${money(callAmount)}`);
        invested += callAmount;
        totalPot += callAmount;
      } else {
        preflopActions.push(`${name}: folds`);
      }
    }
    flopActions.push(`${opener}: bets ${money(2)}`);
    if (index % 5 < 2) {
      flopActions.push(`${hero}: folds`);
      won = 0;
    } else {
      flopActions.push(`${hero}: calls ${money(2)}`);
      invested += 2;
      totalPot += 4;
      turnActions.push(`${opener}: checks`);
      turnActions.push(`${hero}: checks`);
      riverActions.push(`${opener}: checks`);
      riverActions.push(`${hero}: checks`);
      showHero = true;
      showOpponent = true;
      won = index % 3 === 0 ? totalPot - rake : 0;
      opponentWinner = won ? null : opener;
    }
  } else if (type === 'foldFacingOpen') {
    const openerSeat = orderByButton[buttonSeat].find((seat) => seat !== 4);
    const opener = nameForSeat(openerSeat);
    preflopActions.push(`${opener}: raises ${money(1)} to ${money(1.5)}`);
    totalPot += 1.5 - (openerSeat === blinds.bb ? bigBlind : openerSeat === blinds.sb ? smallBlind : 0);
    for (const seat of orderByButton[buttonSeat]) {
      const name = nameForSeat(seat);
      if (name === opener) continue;
      if (seat === 4) preflopActions.push(`${hero}: folds`);
      else preflopActions.push(`${name}: folds`);
    }
  } else if (type === 'openFoldToThreeBet' || type === 'openCallThreeBet' || type === 'fourbet') {
    const playersAfterHero = [...orderByButton[buttonSeat].slice(orderByButton[buttonSeat].indexOf(4) + 1), ...orderByButton[buttonSeat].slice(0, orderByButton[buttonSeat].indexOf(4))].filter((seat) => seat !== 4);
    const threeBettorSeat = playersAfterHero[0];
    const threeBettor = nameForSeat(threeBettorSeat);
    const raiseTo = heroPosition === 'SB' ? 1.5 : 1.25;
    invested += raiseTo - inBlind;
    totalPot += raiseTo - inBlind;
    for (const seat of orderByButton[buttonSeat]) {
      const name = nameForSeat(seat);
      if (seat === 4) {
        preflopActions.push(`${hero}: raises ${money(raiseTo - inBlind)} to ${money(raiseTo)}`);
      } else if (seat === threeBettorSeat) {
        if (preflopActions.some((line) => line.startsWith(`${hero}: raises`))) {
          preflopActions.push(`${name}: raises ${money(4)} to ${money(5.25)}`);
          totalPot += 5.25 - (seat === blinds.bb ? bigBlind : seat === blinds.sb ? smallBlind : 0);
        } else {
          preflopActions.push(`${name}: folds`);
        }
      } else {
        preflopActions.push(`${name}: folds`);
      }
    }
    if (!preflopActions.some((line) => line.startsWith(`${threeBettor}: raises`))) {
      preflopActions.push(`${threeBettor}: raises ${money(4)} to ${money(5.25)}`);
      totalPot += 5.25 - (threeBettorSeat === blinds.bb ? bigBlind : threeBettorSeat === blinds.sb ? smallBlind : 0);
    }
    if (type === 'openFoldToThreeBet') {
      preflopActions.push(`${hero}: folds`);
    } else if (type === 'openCallThreeBet') {
      const callAmount = 5.25 - raiseTo;
      preflopActions.push(`${hero}: calls ${money(callAmount)}`);
      invested += callAmount;
      totalPot += callAmount;
      flopActions.push(`${threeBettor}: bets ${money(4)}`);
      if (index % 5 < 2) {
        flopActions.push(`${hero}: folds`);
      } else {
        flopActions.push(`${hero}: calls ${money(4)}`);
        invested += 4;
        totalPot += 8;
        turnActions.push(`${threeBettor}: bets ${money(8)}`);
        if (index % 2 === 0) {
          turnActions.push(`${hero}: folds`);
        } else {
          turnActions.push(`${hero}: calls ${money(8)}`);
          invested += 8;
          totalPot += 16;
          riverActions.push(`${threeBettor}: checks`);
          riverActions.push(`${hero}: checks`);
          showHero = true;
          showOpponent = true;
          won = index % 4 === 1 ? totalPot - rake : 0;
          opponentWinner = won ? null : threeBettor;
        }
      }
    } else {
      preflopActions.push(`${hero}: raises ${money(12.75)} to ${money(18)}`);
      invested += 18 - raiseTo;
      totalPot += 18 - raiseTo;
      preflopActions.push(`${threeBettor}: folds`);
      preflopActions.push(`${hero}: RETURN ${money(12.75)}`);
      invested -= 12.75;
      totalPot -= 12.75;
      won = totalPot - splashFee;
    }
  } else if (type === 'threebet') {
    const openerSeat = orderByButton[buttonSeat].find((seat) => seat !== 4);
    const opener = nameForSeat(openerSeat);
    preflopActions.push(`${opener}: raises ${money(1)} to ${money(1.5)}`);
    totalPot += 1.5 - (openerSeat === blinds.bb ? bigBlind : openerSeat === blinds.sb ? smallBlind : 0);
    for (const seat of orderByButton[buttonSeat]) {
      const name = nameForSeat(seat);
      if (name === opener) continue;
      if (seat === 4) {
        const raiseTo = 5.25;
        preflopActions.push(`${hero}: raises ${money(raiseTo - inBlind)} to ${money(raiseTo)}`);
        invested += raiseTo - inBlind;
        totalPot += raiseTo - inBlind;
      } else {
        preflopActions.push(`${name}: folds`);
      }
    }
    if (index % 11 < 5) {
      preflopActions.push(`${opener}: raises ${money(10.25)} to ${money(15.50)}`);
      if (index % 11 < 3) {
        preflopActions.push(`${hero}: folds`);
      } else {
        preflopActions.push(`${hero}: calls ${money(10.25)}`);
        invested += 10.25;
        totalPot += 20.5;
        flopActions.push(`${opener}: checks`);
        flopActions.push(`${hero}: checks`);
        turnActions.push(`${opener}: checks`);
        turnActions.push(`${hero}: checks`);
        riverActions.push(`${opener}: checks`);
        riverActions.push(`${hero}: checks`);
        showHero = true;
        showOpponent = true;
        won = index % 2 === 0 ? totalPot - rake : 0;
        opponentWinner = won ? null : opener;
      }
    } else {
      preflopActions.push(`${opener}: folds`);
      preflopActions.push(`${hero}: RETURN ${money(3.75)}`);
      invested -= 3.75;
      totalPot -= 3.75;
      won = totalPot - splashFee;
    }
  } else if (type === 'allin') {
    const villainSeat = orderByButton[buttonSeat].find((seat) => seat !== 4);
    const villain = nameForSeat(villainSeat);
    preflopActions.push(`${villain}: raises ${money(1)} to ${money(1.5)}`);
    for (const seat of orderByButton[buttonSeat]) {
      const name = nameForSeat(seat);
      if (name === villain) continue;
      if (seat === 4) {
        preflopActions.push(`${hero}: raises ${money(48.5 - inBlind)} to ${money(50)} and is all-in`);
        invested += 50 - inBlind;
      } else {
        preflopActions.push(`${name}: folds`);
      }
    }
    preflopActions.push(`${villain}: calls ${money(48.5)} and is all-in`);
    totalPot = 101.23;
    showHero = true;
    showOpponent = true;
    showdownActions.push(`${hero}: shows [${heroCards.join(' ')}]`);
    showdownActions.push(`${villain}: shows [${oppCards.join(' ')}]`);
    if (index % 2 === 0) {
      won = 100.23;
    } else {
      opponentWinner = villain;
      won = 0;
    }
  } else if (type === 'stealFold' && ['CO', 'BTN', 'SB'].includes(heroPosition)) {
    for (const seat of orderByButton[buttonSeat]) {
      const name = nameForSeat(seat);
      if (seat === 4) preflopActions.push(`${hero}: folds`);
      else preflopActions.push(`${name}: folds`);
    }
  } else {
    const limperSeat = orderByButton[buttonSeat].find((seat) => seat !== 4);
    const limper = nameForSeat(limperSeat);
    preflopActions.push(`${limper}: calls ${money(bigBlind)}`);
    totalPot += bigBlind - (limperSeat === blinds.bb ? bigBlind : limperSeat === blinds.sb ? smallBlind : 0);
    for (const seat of orderByButton[buttonSeat]) {
      const name = nameForSeat(seat);
      if (name === limper) continue;
      if (seat === 4) preflopActions.push(`${hero}: folds`);
      else preflopActions.push(`${name}: folds`);
    }
  }

  const profit = Number((won - invested).toFixed(2));
  handProfits.push(profit);

  lines.push(`CoinPoker Hand #${handNumber}: NLH (${money(smallBlind)}/${money(bigBlind)}/${money(ante)}) ${formatDate(date)}`);
  lines.push(`Table '${handCount}001' 6-max Seat #${buttonSeat} is the button`);
  for (const player of seats) {
    const stack = player.name === hero ? Math.max(50 + handProfits.reduce((sum, value) => sum + value, 0), 5) : player.stack + (index % 23);
    lines.push(`Seat ${player.seat}: ${player.name} (${money(stack)} in chips)`);
  }
  for (const player of seats) lines.push(`${player.name}: posts ante ${money(ante)}`);
  lines.push(`${nameForSeat(blinds.sb)}: posts small blind ${money(smallBlind)}`);
  lines.push(`${nameForSeat(blinds.bb)}: posts big blind ${money(bigBlind)}`);
  lines.push('*** HOLE CARDS ***');
  for (const player of seats) {
    if (player.name === hero) lines.push(`Dealt to ${hero} [${heroCards.join(' ')}]`);
    else lines.push(`Dealt to ${player.name}`);
  }
  lines.push(...preflopActions);
  if (flopActions.length || type === 'allin') {
    lines.push(`*** FLOP *** [${board.slice(0, 3).join(' ')}]`);
    lines.push(...flopActions);
  }
  if (turnActions.length || type === 'allin') {
    lines.push(`*** TURN *** [${board.slice(0, 3).join(' ')}] [${board[3]}]`);
    lines.push(...turnActions);
  }
  if (riverActions.length || type === 'allin') {
    lines.push(`*** RIVER *** [${board.slice(0, 4).join(' ')}] [${board[4]}]`);
    lines.push(...riverActions);
  }
  if (showHero || showOpponent || showdownActions.length) {
    lines.push('*** SHOWDOWN ***');
    if (showHero && ((won > 0 && index % 2 === 0) || (won <= 0 && index % 3 === 0)) && !showdownActions.some((line) => line.startsWith(`${hero}: shows`))) {
      lines.push(`${hero}: shows [${heroCards.join(' ')}]`);
    }
    if (showOpponent && !showdownActions.some((line) => line.includes(': shows')) && opponentWinner) {
      lines.push(`${opponentWinner}: shows [${oppCards.join(' ')}]`);
    }
    lines.push(...showdownActions);
    if (won > 0) lines.push(`${hero} collected ${money(won)} from pot`);
    else if (opponentWinner) lines.push(`${opponentWinner} collected ${money(totalPot - rake)} from pot`);
  }
  lines.push('*** SUMMARY ***');
  lines.push(`Total pot ${money(Math.max(totalPot, won + rake))} | Rake ${money(rake)} | Splash Fee ${money(splashFee)}`);
  lines.push('Hand was run once');
  lines.push(`Board [ ${showHero || flopActions.length ? board.join(' ') : ''} ]`);
  lines.push(`Game ended: ${formatDate(new Date(date.getTime() + 27_000))}`);
  for (const player of seats) {
    if (player.name === hero && showHero) {
      lines.push(summaryLineForSeat({ seat: player.seat, shownCards: heroCards, wonAmount: won > 0 ? won : null }));
    } else if (player.name === opponentWinner && showOpponent) {
      lines.push(summaryLineForSeat({ seat: player.seat, shownCards: oppCards, wonAmount: totalPot - rake }));
    } else if (showOpponent && player.name !== hero && player.name !== opponentWinner && player.seat === orderByButton[buttonSeat].find((seat) => seat !== 4)) {
      lines.push(summaryLineForSeat({ seat: player.seat, shownCards: oppCards }));
    } else if (won > 0 && player.name === hero && !showHero) {
      lines.push(`Seat ${player.seat}: ${player.name} collected (${money(won)})`);
    } else {
      lines.push(summaryLineForSeat({ seat: player.seat }));
    }
  }
  lines.push('');
}

writeFileSync(outputPath, lines.join('\n'));

let adjustedText = readFileSync(outputPath, 'utf8');
let adjustedStats = calculateStats(parseCoinPoker(adjustedText));
const adjustment = Number((targetProfit - adjustedStats.profit).toFixed(2));

if (Math.abs(adjustment) > 0) {
  const heroWinMatches = [...adjustedText.matchAll(/Hero collected ₮([\d.]+) from pot/g)];
  const heroSummaryMatches = [
    ...adjustedText.matchAll(/Seat 4: Hero (?:showed \[[^\]]+\] and )?won \(₮([\d.]+)\)/g),
    ...adjustedText.matchAll(/Seat 4: Hero collected \(₮([\d.]+)\)/g),
  ];

  if (!heroSummaryMatches.length) {
    throw new Error('No Hero summary wins available for profit adjustment');
  }

  const baseAdjustment = Math.trunc((adjustment / heroSummaryMatches.length) * 100) / 100;
  const residual = Number((adjustment - baseAdjustment * heroSummaryMatches.length).toFixed(2));
  let collectedIndex = 0;
  let summaryIndex = 0;

  adjustedText = adjustedText.replace(/Hero collected ₮([\d.]+) from pot/g, (match, amount) => {
    const add = baseAdjustment + (collectedIndex === Math.min(heroWinMatches.length, heroSummaryMatches.length) - 1 ? residual : 0);
    collectedIndex++;
    return `Hero collected ${money(Number(amount) + add)} from pot`;
  });
  adjustedText = adjustedText.replace(
    /Seat 4: Hero (showed \[[^\]]+\] and )?won \(₮([\d.]+)\)/g,
    (match, shownText = '', amount) => {
      const add = baseAdjustment + (summaryIndex === heroSummaryMatches.length - 1 ? residual : 0);
      summaryIndex++;
      return `Seat 4: Hero ${shownText}won (${money(Number(amount) + add)})`;
    },
  );
  adjustedText = adjustedText.replace(/Seat 4: Hero collected \(₮([\d.]+)\)/g, (match, amount) => {
    const add = baseAdjustment + (summaryIndex === heroSummaryMatches.length - 1 ? residual : 0);
    summaryIndex++;
    return `Seat 4: Hero collected (${money(Number(amount) + add)})`;
  });
  writeFileSync(outputPath, adjustedText);
}

const fileText = readFileSync(outputPath, 'utf8');
const hands = parseCoinPoker(fileText);
const stats = calculateStats(hands);
console.log(JSON.stringify({
  outputPath,
  hands: hands.length,
  stakes: hands[0]?.table,
  stats: {
    handsPlayed: stats.handsPlayed,
    profit: stats.profit,
    vpip: stats.vpip,
    pfr: stats.pfr,
    threeBet: stats.threeBet,
    foldToThreeBet: stats.foldToThreeBet,
    fourBet: stats.fourBet,
    foldToFourBet: stats.foldToFourBet,
    steal: stats.steal,
    cBet: stats.cBet,
    foldCBet: stats.foldToCBet,
    turnCBet: stats.turnCBet,
    foldTurnCBet: stats.foldToTurnCBet,
    wtsd: stats.wtsd,
    wsd: stats.wsd,
    aggressionFactor: stats.aggressionFactor,
    allInWinSampleSize: stats.allInWinSampleSize,
  },
}, null, 2));
