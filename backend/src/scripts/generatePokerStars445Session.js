import { readFileSync, writeFileSync } from 'node:fs';
import { parsePokerStars } from '../utils/parsers/pokerstars/wrapper.js';
import { calculateStats } from '../utils/parsers/stats/calculateStats.js';

const outputPath = process.env.OUTPUT_PATH || 'src/utils/parsers/fixtures/ps/pokerstars_445_hand_target_session.txt';
const targetProfit = process.env.TARGET_PROFIT === undefined ? null : Number(process.env.TARGET_PROFIT);
const handCount = Number(process.env.HAND_COUNT ?? 445);
const smallBlind = Number(process.env.SMALL_BLIND ?? 0.25);
const bigBlind = Number(process.env.BIG_BLIND ?? 0.5);
const ante = Number(process.env.ANTE ?? 0);
const stakeScale = bigBlind / 0.1;
const rake = 0;
const hero = 'Hero';
const seats = [
  { seat: 1, name: hero, stack: 100 },
  { seat: 2, name: 'CutoffCat', stack: 100 },
  { seat: 3, name: 'ButtonAce', stack: 100 },
  { seat: 4, name: 'SmallBlindSam', stack: 100 },
  { seat: 5, name: 'BigBlindBea', stack: 100 },
  { seat: 6, name: 'UnderGunUma', stack: 100 },
];
const startTime = new Date(process.env.START_TIME ?? '2026-08-04T08:00:00-04:00');
const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const suits = ['s', 'h', 'd', 'c'];
const positionRanges = {
  UTG: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', 'AKs', 'AQs', 'AJs', 'KQs', 'AKo', 'AQo'],
  HJ: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', 'AKs', 'AQs', 'AJs', 'ATs', 'KQs', 'QJs', 'AKo', 'AQo', 'AJo'],
  CO: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', 'AKs', 'AQs', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs', 'JTs', 'AKo', 'AQo', 'AJo', 'KQo'],
  BTN: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22', 'AKs', 'AQs', 'AJs', 'ATs', 'A5s', 'KQs', 'KJs', 'QJs', 'JTs', 'T9s', '98s', 'AKo', 'AQo', 'AJo', 'KQo'],
  SB: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22', 'AKs', 'AQs', 'AJs', 'ATs', 'A5s', 'KQs', 'KJs', 'QJs', 'JTs', 'T9s', 'AKo', 'AQo', 'AJo', 'KQo'],
};
positionRanges.BB = positionRanges.HJ;

const positionByButton = {
  1: 'BTN',
  2: 'SB',
  3: 'BB',
  4: 'UTG',
  5: 'HJ',
  6: 'CO',
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

let seed = 20260804;
function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 32;
}
function pick(items) {
  return items[Math.floor(random() * items.length)];
}
function money(amount) {
  return `$${amount.toFixed(2)}`;
}
function stake(amount) {
  return Number((amount * stakeScale).toFixed(2));
}
function formatDate(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
function cardCode(rank, suit) {
  return `${rank}${suit}`;
}
function comboToCards(combo) {
  if (combo[0] === combo[1]) {
    const shuffledSuits = [...suits].sort(() => random() - 0.5);
    return [cardCode(combo[0], shuffledSuits[0]), cardCode(combo[1], shuffledSuits[1])];
  }
  const suited = combo.endsWith('s');
  const firstSuit = pick(suits);
  const secondSuit = suited ? firstSuit : pick(suits.filter((suit) => suit !== firstSuit));
  return [cardCode(combo[0], firstSuit), cardCode(combo[1], secondSuit)];
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
function blindPosted(seat, blinds) {
  if (seat === blinds.sb) return smallBlind;
  if (seat === blinds.bb) return bigBlind;
  return 0;
}
function foldBeforeFlopLine(player) {
  return `Seat ${player.seat}: ${player.name} folded before Flop`;
}
function summaryLineForPlayer(player, { result = 'foldedPreflop', cards = null, amount = null, street = 'Flop' } = {}) {
  if (result === 'won') return `Seat ${player.seat}: ${player.name} showed [${cards.join(' ')}] and won (${money(amount)}) with a pair`;
  if (result === 'lost') return `Seat ${player.seat}: ${player.name} showed [${cards.join(' ')}] and lost with high card`;
  if (result === 'collected') return `Seat ${player.seat}: ${player.name} collected (${money(amount)})`;
  if (result === 'mucked') return `Seat ${player.seat}: ${player.name} mucked [${cards.join(' ')}]`;
  if (result === 'folded') return `Seat ${player.seat}: ${player.name} folded on the ${street}`;
  return foldBeforeFlopLine(player);
}

const basePlan = [
  'mediumPotWin',
  ...Array.from({ length: 65 }, () => 'open'),
  ...Array.from({ length: 20 }, () => 'call'),
  ...Array.from({ length: 16 }, () => 'threebet'),
  ...Array.from({ length: 1 }, () => 'allin'),
  ...Array.from({ length: 147 }, () => 'foldFacingOpen'),
  ...Array.from({ length: 27 }, () => 'openFoldToThreeBet'),
  ...Array.from({ length: 20 }, () => 'openCallThreeBet'),
  ...Array.from({ length: 5 }, () => 'fourbet'),
  ...Array.from({ length: 72 }, () => 'stealFold'),
  ...Array.from({ length: 71 }, () => 'foldLimped'),
];
const plan = basePlan.sort(() => random() - 0.5);
const lines = [];
const handProfits = [];
let allInScenarioIndex = 0;

for (let index = 0; index < handCount; index++) {
  const buttonSeat = (index % 6) + 1;
  const heroPosition = positionByButton[buttonSeat];
  const blinds = blindsByButton[buttonSeat];
  const handNumber = 700000000 + index;
  const date = new Date(startTime.getTime() + index * 73_000);
  const heroCards = uniqueHeroCards(heroPosition, index);
  const deck = freshDeck(heroCards);
  const board = draw(deck, 5);
  const villainCards = draw(deck, 2);
  const type = plan[index];
  const inBlind = blindPosted(1, blinds);
  const openTo = stake(0.4);
  const openFromSmallBlindTo = stake(0.3);
  const cBetAmount = stake(0.55);
  const turnBetAmount = stake(1.1);
  const threeBetAdd = stake(0.9);
  const threeBetTo = stake(1.3);
  const fourBetAdd = stake(2.7);
  const fourBetTo = stake(4);
  const coldFourBetAdd = stake(2.2);
  const coldFourBetTo = stake(3.5);
  const threeBetPotFlopBet = stake(1);
  const threeBetPotTurnBet = stake(2);
  const allInTo = stake(20);
  let invested = ante + inBlind;
  let won = 0;
  let totalPot = 6 * ante + smallBlind + bigBlind;
  let heroSummary = { result: 'foldedPreflop' };
  let villainSummary = null;
  let villainSeat = null;
  let villain = null;
  let showedDown = false;
  let streetFolded = null;
  const preflopActions = [];
  const flopActions = [];
  const turnActions = [];
  const riverActions = [];
  const showdownActions = [];

  if (type === 'mediumPotWin') {
    const raiseTo = openTo;
    const playersAfterHero = [...orderByButton[buttonSeat].slice(orderByButton[buttonSeat].indexOf(1) + 1), ...orderByButton[buttonSeat].slice(0, orderByButton[buttonSeat].indexOf(1))].filter((seat) => seat !== 1);
    villainSeat = playersAfterHero[0];
    villain = nameForSeat(villainSeat);
    invested += raiseTo - inBlind;
    totalPot += raiseTo - inBlind;

    for (const seat of orderByButton[buttonSeat]) {
      const name = nameForSeat(seat);
      if (seat === 1) preflopActions.push(`${hero}: raises ${money(raiseTo - inBlind)} to ${money(raiseTo)}`);
      else if (seat === villainSeat) {
        const callAmount = Math.max(raiseTo - blindPosted(seat, blinds), 0);
        preflopActions.push(`${name}: calls ${money(callAmount)}`);
        totalPot += callAmount;
      } else preflopActions.push(`${name}: folds`);
    }

    flopActions.push(`${hero}: bets ${money(3.25)}`);
    flopActions.push(`${villain}: calls ${money(3.25)}`);
    invested += 3.25;
    totalPot += 6.5;
    turnActions.push(`${hero}: bets ${money(8.5)}`);
    turnActions.push(`${villain}: calls ${money(8.5)}`);
    invested += 8.5;
    totalPot += 17;
    riverActions.push(`${hero}: bets ${money(8.75)}`);
    riverActions.push(`${villain}: calls ${money(8.75)}`);
    invested += 8.75;
    totalPot += 17.5;
    won = totalPot;
    showedDown = true;
    heroSummary = { result: 'won', cards: heroCards, amount: won };
    villainSummary = { result: 'lost', cards: villainCards };
  } else if (type === 'open') {
    const raiseTo = heroPosition === 'SB' ? openFromSmallBlindTo : openTo;
    invested += raiseTo - inBlind;
    totalPot += raiseTo - inBlind;
    const playersAfterHero = [...orderByButton[buttonSeat].slice(orderByButton[buttonSeat].indexOf(1) + 1), ...orderByButton[buttonSeat].slice(0, orderByButton[buttonSeat].indexOf(1))].filter((seat) => seat !== 1);
    villainSeat = playersAfterHero.find(() => random() < 0.34) || null;
    villain = villainSeat ? nameForSeat(villainSeat) : null;

    for (const seat of orderByButton[buttonSeat]) {
      const name = nameForSeat(seat);
      if (seat === 1) preflopActions.push(`${hero}: raises ${money(raiseTo - inBlind)} to ${money(raiseTo)}`);
      else if (seat === villainSeat) {
        const callAmount = Math.max(raiseTo - blindPosted(seat, blinds), 0);
        preflopActions.push(`${name}: calls ${money(callAmount)}`);
        totalPot += callAmount;
      } else preflopActions.push(`${name}: folds`);
    }

    if (!villain) {
      const returned = Math.max(raiseTo - (blinds.bb === 1 ? bigBlind : 0), bigBlind);
      preflopActions.push(`Uncalled bet (${money(returned)}) returned to ${hero}`);
      invested -= returned;
      totalPot -= returned;
      won = totalPot;
      heroSummary = { result: 'collected', amount: won };
    } else {
      const cbet = index % 10 < 7;
      const flopCalled = cbet && index % 7 < 3;
      flopActions.push(cbet ? `${hero}: bets ${money(cBetAmount)}` : `${hero}: checks`);
      if (cbet) {
        invested += cBetAmount;
        totalPot += cBetAmount;
        flopActions.push(flopCalled ? `${villain}: calls ${money(cBetAmount)}` : `${villain}: folds`);
        if (flopCalled) totalPot += cBetAmount;
      } else {
        flopActions.push(`${villain}: checks`);
      }

      if (!flopCalled && cbet) {
        flopActions.push(`Uncalled bet (${money(cBetAmount)}) returned to ${hero}`);
        invested -= cBetAmount;
        totalPot -= cBetAmount;
        won = totalPot;
        heroSummary = { result: 'collected', amount: won };
      } else if (flopCalled && index % 2 === 0) {
        turnActions.push(`${hero}: bets ${money(turnBetAmount)}`);
        invested += turnBetAmount;
        totalPot += turnBetAmount;
        if (index % 4 === 0) {
          turnActions.push(`${villain}: folds`);
          turnActions.push(`Uncalled bet (${money(turnBetAmount)}) returned to ${hero}`);
          invested -= turnBetAmount;
          totalPot -= turnBetAmount;
          won = totalPot;
          heroSummary = { result: 'collected', amount: won };
        } else {
          turnActions.push(`${villain}: calls ${money(turnBetAmount)}`);
          totalPot += turnBetAmount;
          riverActions.push(`${hero}: checks`);
          riverActions.push(`${villain}: checks`);
          showedDown = true;
          if (index % 6 === 0) {
            won = totalPot;
            heroSummary = { result: 'won', cards: heroCards, amount: won };
            villainSummary = { result: 'lost', cards: villainCards };
          } else {
            heroSummary = { result: 'lost', cards: heroCards };
            villainSummary = { result: 'won', cards: villainCards, amount: totalPot };
          }
        }
      } else {
        turnActions.push(`${hero}: checks`);
        turnActions.push(`${villain}: checks`);
        riverActions.push(`${hero}: checks`);
        riverActions.push(`${villain}: checks`);
        showedDown = true;
        if (index % 5 === 0) {
          won = totalPot;
          heroSummary = { result: 'won', cards: heroCards, amount: won };
          villainSummary = { result: 'lost', cards: villainCards };
        } else {
          heroSummary = { result: 'mucked', cards: heroCards };
          villainSummary = { result: 'won', cards: villainCards, amount: totalPot };
        }
      }
    }
  } else if (type === 'call') {
    villainSeat = orderByButton[buttonSeat].find((seat) => seat !== 1);
    villain = nameForSeat(villainSeat);
    preflopActions.push(`${villain}: raises ${money(openFromSmallBlindTo)} to ${money(openTo)}`);
    totalPot += openTo - blindPosted(villainSeat, blinds);
    for (const seat of orderByButton[buttonSeat]) {
      const name = nameForSeat(seat);
      if (seat === villainSeat) continue;
      if (seat === 1) {
        const callAmount = openTo - inBlind;
        preflopActions.push(`${hero}: calls ${money(callAmount)}`);
        invested += callAmount;
        totalPot += callAmount;
      } else preflopActions.push(`${name}: folds`);
    }
    flopActions.push(`${villain}: bets ${money(cBetAmount)}`);
    if (index % 5 < 2) {
      flopActions.push(`${hero}: folds`);
      streetFolded = 'Flop';
      heroSummary = { result: 'folded', street: 'Flop' };
    } else {
      flopActions.push(`${hero}: calls ${money(cBetAmount)}`);
      invested += cBetAmount;
      totalPot += cBetAmount * 2;
      turnActions.push(`${villain}: checks`);
      turnActions.push(`${hero}: checks`);
      riverActions.push(`${villain}: checks`);
      riverActions.push(`${hero}: checks`);
      showedDown = true;
      if (index % 3 === 0) {
        won = totalPot;
        heroSummary = { result: 'won', cards: heroCards, amount: won };
        villainSummary = { result: 'lost', cards: villainCards };
      } else {
        heroSummary = { result: 'lost', cards: heroCards };
        villainSummary = { result: 'won', cards: villainCards, amount: totalPot };
      }
    }
  } else if (type === 'foldFacingOpen') {
    villainSeat = orderByButton[buttonSeat].find((seat) => seat !== 1);
    villain = nameForSeat(villainSeat);
    preflopActions.push(`${villain}: raises ${money(openFromSmallBlindTo)} to ${money(openTo)}`);
    totalPot += openTo - blindPosted(villainSeat, blinds);
    for (const seat of orderByButton[buttonSeat]) {
      const name = nameForSeat(seat);
      if (seat === villainSeat) continue;
      preflopActions.push(seat === 1 ? `${hero}: folds` : `${name}: folds`);
    }
  } else if (type === 'openFoldToThreeBet' || type === 'openCallThreeBet' || type === 'fourbet') {
    const playersAfterHero = [...orderByButton[buttonSeat].slice(orderByButton[buttonSeat].indexOf(1) + 1), ...orderByButton[buttonSeat].slice(0, orderByButton[buttonSeat].indexOf(1))].filter((seat) => seat !== 1);
    villainSeat = playersAfterHero[0];
    villain = nameForSeat(villainSeat);
    const raiseTo = heroPosition === 'SB' ? openFromSmallBlindTo : openTo;
    invested += raiseTo - inBlind;
    totalPot += raiseTo - inBlind;
    for (const seat of orderByButton[buttonSeat]) {
      const name = nameForSeat(seat);
      if (seat === 1) preflopActions.push(`${hero}: raises ${money(raiseTo - inBlind)} to ${money(raiseTo)}`);
      else if (seat === villainSeat) {
        preflopActions.push(`${name}: raises ${money(threeBetAdd)} to ${money(threeBetTo)}`);
        totalPot += threeBetTo - blindPosted(seat, blinds);
      } else preflopActions.push(`${name}: folds`);
    }
    if (type === 'openFoldToThreeBet') {
      preflopActions.push(`${hero}: folds`);
    } else if (type === 'openCallThreeBet') {
      const callAmount = threeBetTo - raiseTo;
      preflopActions.push(`${hero}: calls ${money(callAmount)}`);
      invested += callAmount;
      totalPot += callAmount;
      flopActions.push(`${villain}: bets ${money(threeBetPotFlopBet)}`);
      if (index % 5 < 2) {
        flopActions.push(`${hero}: folds`);
        heroSummary = { result: 'folded', street: 'Flop' };
      } else {
        flopActions.push(`${hero}: calls ${money(threeBetPotFlopBet)}`);
        invested += threeBetPotFlopBet;
        totalPot += threeBetPotFlopBet * 2;
        turnActions.push(`${villain}: bets ${money(threeBetPotTurnBet)}`);
        if (index % 2 === 0) {
          turnActions.push(`${hero}: folds`);
          heroSummary = { result: 'folded', street: 'Turn' };
        } else {
          turnActions.push(`${hero}: calls ${money(threeBetPotTurnBet)}`);
          invested += threeBetPotTurnBet;
          totalPot += threeBetPotTurnBet * 2;
          riverActions.push(`${villain}: checks`);
          riverActions.push(`${hero}: checks`);
          showedDown = true;
          if (index % 4 === 1) {
            won = totalPot;
            heroSummary = { result: 'won', cards: heroCards, amount: won };
            villainSummary = { result: 'lost', cards: villainCards };
          } else {
            heroSummary = { result: 'mucked', cards: heroCards };
            villainSummary = { result: 'won', cards: villainCards, amount: totalPot };
          }
        }
      }
    } else {
      preflopActions.push(`${hero}: raises ${money(fourBetAdd)} to ${money(fourBetTo)}`);
      invested += fourBetTo - raiseTo;
      totalPot += fourBetTo - raiseTo;
      preflopActions.push(`${villain}: folds`);
      preflopActions.push(`Uncalled bet (${money(fourBetAdd)}) returned to ${hero}`);
      invested -= fourBetAdd;
      totalPot -= fourBetAdd;
      won = totalPot;
      heroSummary = { result: 'collected', amount: won };
    }
  } else if (type === 'threebet') {
    villainSeat = orderByButton[buttonSeat].find((seat) => seat !== 1);
    villain = nameForSeat(villainSeat);
    preflopActions.push(`${villain}: raises ${money(openFromSmallBlindTo)} to ${money(openTo)}`);
    totalPot += openTo - blindPosted(villainSeat, blinds);
    for (const seat of orderByButton[buttonSeat]) {
      const name = nameForSeat(seat);
      if (seat === villainSeat) continue;
      if (seat === 1) {
        preflopActions.push(`${hero}: raises ${money(threeBetAdd)} to ${money(threeBetTo)}`);
        invested += threeBetTo - inBlind;
        totalPot += threeBetTo - inBlind;
      } else preflopActions.push(`${name}: folds`);
    }
    if (index % 11 < 5) {
      preflopActions.push(`${villain}: raises ${money(coldFourBetAdd)} to ${money(coldFourBetTo)}`);
      if (index % 11 < 3) {
        preflopActions.push(`${hero}: folds`);
      } else {
        preflopActions.push(`${hero}: calls ${money(coldFourBetAdd)}`);
        invested += coldFourBetAdd;
        totalPot += coldFourBetAdd * 2;
        flopActions.push(`${villain}: checks`);
        flopActions.push(`${hero}: checks`);
        turnActions.push(`${villain}: checks`);
        turnActions.push(`${hero}: checks`);
        riverActions.push(`${villain}: checks`);
        riverActions.push(`${hero}: checks`);
        showedDown = true;
        if (index % 2 === 0) {
          won = totalPot;
          heroSummary = { result: 'won', cards: heroCards, amount: won };
          villainSummary = { result: 'lost', cards: villainCards };
        } else {
          heroSummary = { result: 'lost', cards: heroCards };
          villainSummary = { result: 'won', cards: villainCards, amount: totalPot };
        }
      }
    } else {
      preflopActions.push(`${villain}: folds`);
      preflopActions.push(`Uncalled bet (${money(threeBetAdd)}) returned to ${hero}`);
      invested -= threeBetAdd;
      totalPot -= threeBetAdd;
      won = totalPot;
      heroSummary = { result: 'collected', amount: won };
    }
  } else if (type === 'allin') {
    const heroWinsAllIn = allInScenarioIndex === 0;
    allInScenarioIndex++;
    villainSeat = orderByButton[buttonSeat].find((seat) => seat !== 1);
    villain = nameForSeat(villainSeat);
    preflopActions.push(`${villain}: raises ${money(openFromSmallBlindTo)} to ${money(openTo)}`);
    for (const seat of orderByButton[buttonSeat]) {
      const name = nameForSeat(seat);
      if (seat === villainSeat) continue;
      if (seat === 1) {
        preflopActions.push(`${hero}: raises ${money(allInTo - openTo)} to ${money(allInTo)} and is all-in`);
        invested += allInTo - inBlind;
      } else preflopActions.push(`${name}: folds`);
    }
    preflopActions.push(`${villain}: calls ${money(allInTo - openTo)} and is all-in`);
    totalPot = Number((allInTo * 2 + 6 * ante + smallBlind + bigBlind).toFixed(2));
    showedDown = true;
    showdownActions.push(`${hero}: shows [${heroCards.join(' ')}]`);
    showdownActions.push(`${villain}: shows [${villainCards.join(' ')}]`);
    if (heroWinsAllIn) {
      won = totalPot;
      heroSummary = { result: 'won', cards: heroCards, amount: won };
      villainSummary = { result: 'lost', cards: villainCards };
    } else {
      heroSummary = { result: 'lost', cards: heroCards };
      villainSummary = { result: 'won', cards: villainCards, amount: totalPot };
    }
  } else if (type === 'stealFold' && ['CO', 'BTN', 'SB'].includes(heroPosition)) {
    for (const seat of orderByButton[buttonSeat]) {
      const name = nameForSeat(seat);
      preflopActions.push(seat === 1 ? `${hero}: folds` : `${name}: folds`);
    }
  } else {
    villainSeat = orderByButton[buttonSeat].find((seat) => seat !== 1);
    villain = nameForSeat(villainSeat);
    const callAmount = Math.max(bigBlind - blindPosted(villainSeat, blinds), 0);
    preflopActions.push(`${villain}: calls ${money(callAmount)}`);
    totalPot += callAmount;
    for (const seat of orderByButton[buttonSeat]) {
      const name = nameForSeat(seat);
      if (seat === villainSeat) continue;
      preflopActions.push(seat === 1 ? `${hero}: folds` : `${name}: folds`);
    }
  }

  const priorRunningProfit = handProfits.reduce((sum, value) => sum + value, 0);
  const handProfit = Number((won - invested).toFixed(2));
  handProfits.push(handProfit);

  lines.push(`PokerStars Hand #${handNumber}: Hold'em No Limit (${money(smallBlind)}/${money(bigBlind)} USD) - ${formatDate(date)}`);
  lines.push(`Table 'RiverIQ Target pokerstars ${handCount}' 6-max Seat #${buttonSeat} is the button`);
  for (const player of seats) {
    const stack = player.name === hero ? Math.max(player.stack + priorRunningProfit, bigBlind * 10) : player.stack + (index % 19) * bigBlind;
    lines.push(`Seat ${player.seat}: ${player.name} (${money(stack)} in chips)`);
  }
  if (ante > 0) {
    for (const player of seats) lines.push(`${player.name}: posts the ante ${money(ante)}`);
  }
  lines.push(`${nameForSeat(blinds.sb)}: posts small blind ${money(smallBlind)}`);
  lines.push(`${nameForSeat(blinds.bb)}: posts big blind ${money(bigBlind)}`);
  lines.push('*** HOLE CARDS ***');
  lines.push(`Dealt to ${hero} [${heroCards.join(' ')}]`);
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
  if (showedDown || showdownActions.length) {
    lines.push('*** SHOW DOWN ***');
    if (showedDown && !showdownActions.length) {
      lines.push(`${hero}: shows [${heroCards.join(' ')}]`);
      if (villain) lines.push(`${villain}: shows [${villainCards.join(' ')}]`);
    }
    lines.push(...showdownActions);
  }
  lines.push('*** SUMMARY ***');
  lines.push(`Total pot ${money(Math.max(totalPot, won))} | Rake ${money(rake)}`);
  const shownBoard = flopActions.length || type === 'allin' ? board.slice(0, riverActions.length || type === 'allin' ? 5 : turnActions.length ? 4 : 3) : [];
  if (shownBoard.length) lines.push(`Board [${shownBoard.join(' ')}]`);
  for (const player of seats) {
    if (player.name === hero) {
      lines.push(summaryLineForPlayer(player, heroSummary));
    } else if (player.name === villain && villainSummary) {
      lines.push(summaryLineForPlayer(player, villainSummary));
    } else {
      lines.push(foldBeforeFlopLine(player));
    }
  }
  lines.push('');
}

writeFileSync(outputPath, lines.join('\n'));

let adjustedText = readFileSync(outputPath, 'utf8');
let adjustedStats = calculateStats(parsePokerStars(adjustedText));
const adjustment = targetProfit === null ? 0 : Number((targetProfit - adjustedStats.profit).toFixed(2));

if (Math.abs(adjustment) > 0) {
  const heroSummaryMatches = [
    ...adjustedText.matchAll(/Seat 1: Hero (?:showed \[[^\]]+\] and won|collected) \(\$([\d.]+)\)/g),
  ];

  if (!heroSummaryMatches.length) {
    throw new Error('No Hero summary wins available for profit adjustment');
  }

  const baseAdjustment = Math.trunc((adjustment / heroSummaryMatches.length) * 100) / 100;
  const residual = Number((adjustment - baseAdjustment * heroSummaryMatches.length).toFixed(2));
  let summaryIndex = 0;

  adjustedText = adjustedText.replace(/Seat 1: Hero showed \[([^\]]+)\] and won \(\$([\d.]+)\) with/g, (match, cards, amount) => {
    const add = baseAdjustment + (summaryIndex === heroSummaryMatches.length - 1 ? residual : 0);
    summaryIndex++;
    return `Seat 1: Hero showed [${cards}] and won (${money(Number(amount) + add)}) with`;
  });
  adjustedText = adjustedText.replace(/Seat 1: Hero collected \(\$([\d.]+)\)/g, (match, amount) => {
    const add = baseAdjustment + (summaryIndex === heroSummaryMatches.length - 1 ? residual : 0);
    summaryIndex++;
    return `Seat 1: Hero collected (${money(Number(amount) + add)})`;
  });
  adjustedText = adjustedText
    .split(/\n(?=PokerStars (?:Zoom )?(?:Hand|Game) #)/)
    .map((handText) => {
      const heroWinMatch = handText.match(/Seat 1: Hero (?:showed \[[^\]]+\] and won|collected) \(\$([\d.]+)\)/);
      const totalPotMatch = handText.match(/Total pot \$([\d.]+) \| Rake/);

      if (!heroWinMatch || !totalPotMatch) {
        return handText;
      }

      const heroWin = Number(heroWinMatch[1]);
      const totalPot = Number(totalPotMatch[1]);

      if (!Number.isFinite(heroWin) || !Number.isFinite(totalPot) || heroWin <= totalPot) {
        return handText;
      }

      return handText.replace(/Total pot \$([\d.]+) \| Rake/, `Total pot ${money(heroWin)} | Rake`);
    })
    .join('\n');
  writeFileSync(outputPath, adjustedText);
}

const fileText = readFileSync(outputPath, 'utf8');
const hands = parsePokerStars(fileText);
const stats = calculateStats(hands);
console.log(
  JSON.stringify(
    {
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
    },
    null,
    2,
  ),
);
