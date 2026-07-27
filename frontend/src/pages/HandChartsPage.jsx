import './HandChartsPage.css';

import { ChevronDown, Info, Lock, Table2, X } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';
import { useSessions } from '../hooks/useSessions';
import { positionsByTableSize, tableSizes } from '../utils/analytics/positions';

const positionTitles = {
  'UTG+2': 'UTG+2',
  'UTG+1': 'UTG+1',
  UTG: 'UTG (Under the gun)',
  LJ: 'LJ (Lojack)',
  HJ: 'HJ (Hijack)',
  CO: 'CO (Cutoff)',
  BTN: 'BTN (Button)',
  SB: 'SB (Small blind)',
  BB: 'BB (Big blind)',
};

const recommendedRanges = {
  '6max': {
    UTG: [
      'AA',
      'KK',
      'QQ',
      'JJ',
      'TT',
      '99',
      '88',
      '77',
      'AKs',
      'AQs',
      'AJs',
      'ATs',
      'A9s',
      'KQs',
      'KJs',
      'KTs',
      'QJs',
      'QTs',
      'JTs',
      'AKo',
      'AQo',
      'AJo',
      'KQo',
    ],
    HJ: [
      'AA',
      'KK',
      'QQ',
      'JJ',
      'TT',
      '99',
      '88',
      '77',
      '66',
      'AKs',
      'AQs',
      'AJs',
      'ATs',
      'A9s',
      'A8s',
      'KQs',
      'KJs',
      'KTs',
      'QJs',
      'QTs',
      'JTs',
      'T9s',
      '98s',
      'AKo',
      'AQo',
      'AJo',
      'ATo',
      'KQo',
      'KJo',
    ],
    CO: [
      'AA',
      'KK',
      'QQ',
      'JJ',
      'TT',
      '99',
      '88',
      '77',
      '66',
      '55',
      '44',
      'AKs',
      'AQs',
      'AJs',
      'ATs',
      'A9s',
      'A8s',
      'A7s',
      'A6s',
      'A5s',
      'KQs',
      'KJs',
      'KTs',
      'K9s',
      'QJs',
      'QTs',
      'Q9s',
      'JTs',
      'J9s',
      'T9s',
      '98s',
      '87s',
      '76s',
      'AKo',
      'AQo',
      'AJo',
      'ATo',
      'A9o',
      'KQo',
      'KJo',
      'QJo',
    ],
    BTN: [
      'AA',
      'KK',
      'QQ',
      'JJ',
      'TT',
      '99',
      '88',
      '77',
      '66',
      '55',
      '44',
      '33',
      '22',
      'AKs',
      'AQs',
      'AJs',
      'ATs',
      'A9s',
      'A8s',
      'A7s',
      'A6s',
      'A5s',
      'A4s',
      'A3s',
      'A2s',
      'KQs',
      'KJs',
      'KTs',
      'K9s',
      'K8s',
      'K7s',
      'K6s',
      'QJs',
      'QTs',
      'Q9s',
      'Q8s',
      'JTs',
      'J9s',
      'J8s',
      'T9s',
      'T8s',
      '98s',
      '97s',
      '87s',
      '86s',
      '76s',
      '75s',
      '65s',
      '54s',
      'AKo',
      'AQo',
      'AJo',
      'ATo',
      'A9o',
      'A8o',
      'KQo',
      'KJo',
      'KTo',
      'QJo',
      'QTo',
      'JTo',
    ],
    SB: [
      'AA',
      'KK',
      'QQ',
      'JJ',
      'TT',
      '99',
      '88',
      '77',
      '66',
      '55',
      '44',
      '33',
      '22',
      'AKs',
      'AQs',
      'AJs',
      'ATs',
      'A9s',
      'A8s',
      'A7s',
      'A6s',
      'A5s',
      'A4s',
      'A3s',
      'A2s',
      'KQs',
      'KJs',
      'KTs',
      'K9s',
      'K8s',
      'QJs',
      'QTs',
      'Q9s',
      'JTs',
      'J9s',
      'T9s',
      '98s',
      '87s',
      'AKo',
      'AQo',
      'AJo',
      'ATo',
      'A9o',
      'KQo',
      'KJo',
      'QJo',
    ],
  },
  '7max': {
    UTG: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AQs', 'AJs', 'ATs', 'KQs', 'AKo', 'AQo'],
    LJ: [
      'AA',
      'KK',
      'QQ',
      'JJ',
      'TT',
      '99',
      '88',
      'AKs',
      'AQs',
      'AJs',
      'ATs',
      'A9s',
      'KQs',
      'KJs',
      'QJs',
      'JTs',
      'AKo',
      'AQo',
      'AJo',
      'KQo',
    ],
    HJ: [
      'AA',
      'KK',
      'QQ',
      'JJ',
      'TT',
      '99',
      '88',
      '77',
      'AKs',
      'AQs',
      'AJs',
      'ATs',
      'A9s',
      'KQs',
      'KJs',
      'KTs',
      'QJs',
      'QTs',
      'JTs',
      'AKo',
      'AQo',
      'AJo',
      'KQo',
    ],
    CO: [
      'AA',
      'KK',
      'QQ',
      'JJ',
      'TT',
      '99',
      '88',
      '77',
      '66',
      '55',
      'AKs',
      'AQs',
      'AJs',
      'ATs',
      'A9s',
      'A8s',
      'A7s',
      'A5s',
      'KQs',
      'KJs',
      'KTs',
      'K9s',
      'QJs',
      'QTs',
      'Q9s',
      'JTs',
      'J9s',
      'T9s',
      '98s',
      '87s',
      'AKo',
      'AQo',
      'AJo',
      'ATo',
      'KQo',
      'KJo',
      'QJo',
    ],
    BTN: [
      'AA',
      'KK',
      'QQ',
      'JJ',
      'TT',
      '99',
      '88',
      '77',
      '66',
      '55',
      '44',
      '33',
      '22',
      'AKs',
      'AQs',
      'AJs',
      'ATs',
      'A9s',
      'A8s',
      'A7s',
      'A6s',
      'A5s',
      'A4s',
      'A3s',
      'A2s',
      'KQs',
      'KJs',
      'KTs',
      'K9s',
      'K8s',
      'K7s',
      'QJs',
      'QTs',
      'Q9s',
      'Q8s',
      'JTs',
      'J9s',
      'J8s',
      'T9s',
      'T8s',
      '98s',
      '97s',
      '87s',
      '86s',
      '76s',
      '75s',
      '65s',
      '54s',
      'AKo',
      'AQo',
      'AJo',
      'ATo',
      'A9o',
      'A8o',
      'KQo',
      'KJo',
      'KTo',
      'QJo',
      'QTo',
      'JTo',
    ],
    SB: [
      'AA',
      'KK',
      'QQ',
      'JJ',
      'TT',
      '99',
      '88',
      '77',
      '66',
      '55',
      '44',
      '33',
      '22',
      'AKs',
      'AQs',
      'AJs',
      'ATs',
      'A9s',
      'A8s',
      'A7s',
      'A6s',
      'A5s',
      'A4s',
      'A3s',
      'A2s',
      'KQs',
      'KJs',
      'KTs',
      'K9s',
      'K8s',
      'QJs',
      'QTs',
      'Q9s',
      'JTs',
      'J9s',
      'T9s',
      '98s',
      '87s',
      'AKo',
      'AQo',
      'AJo',
      'ATo',
      'KQo',
      'KJo',
    ],
  },
  '8max': {
    UTG: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AQs', 'AJs', 'KQs', 'AKo', 'AQo'],
    'UTG+1': ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', 'AKs', 'AQs', 'AJs', 'ATs', 'KQs', 'AKo', 'AQo'],
    LJ: [
      'AA',
      'KK',
      'QQ',
      'JJ',
      'TT',
      '99',
      '88',
      '77',
      'AKs',
      'AQs',
      'AJs',
      'ATs',
      'A9s',
      'KQs',
      'KJs',
      'QJs',
      'JTs',
      'AKo',
      'AQo',
      'AJo',
      'KQo',
    ],
    HJ: [
      'AA',
      'KK',
      'QQ',
      'JJ',
      'TT',
      '99',
      '88',
      '77',
      '66',
      'AKs',
      'AQs',
      'AJs',
      'ATs',
      'A9s',
      'KQs',
      'KJs',
      'KTs',
      'QJs',
      'QTs',
      'JTs',
      'AKo',
      'AQo',
      'AJo',
      'KQo',
    ],
    CO: [
      'AA',
      'KK',
      'QQ',
      'JJ',
      'TT',
      '99',
      '88',
      '77',
      '66',
      '55',
      '44',
      'AKs',
      'AQs',
      'AJs',
      'ATs',
      'A9s',
      'A8s',
      'A5s',
      'KQs',
      'KJs',
      'KTs',
      'K9s',
      'QJs',
      'QTs',
      'Q9s',
      'JTs',
      'J9s',
      'T9s',
      '98s',
      '87s',
      'AKo',
      'AQo',
      'AJo',
      'ATo',
      'KQo',
      'KJo',
      'QJo',
    ],
    BTN: [
      'AA',
      'KK',
      'QQ',
      'JJ',
      'TT',
      '99',
      '88',
      '77',
      '66',
      '55',
      '44',
      '33',
      '22',
      'AKs',
      'AQs',
      'AJs',
      'ATs',
      'A9s',
      'A8s',
      'A7s',
      'A6s',
      'A5s',
      'A4s',
      'A3s',
      'A2s',
      'KQs',
      'KJs',
      'KTs',
      'K9s',
      'K8s',
      'K7s',
      'QJs',
      'QTs',
      'Q9s',
      'Q8s',
      'JTs',
      'J9s',
      'J8s',
      'T9s',
      'T8s',
      '98s',
      '97s',
      '87s',
      '86s',
      '76s',
      '75s',
      '65s',
      '54s',
      'AKo',
      'AQo',
      'AJo',
      'ATo',
      'A9o',
      'A8o',
      'KQo',
      'KJo',
      'KTo',
      'QJo',
      'QTo',
      'JTo',
    ],
    SB: [
      'AA',
      'KK',
      'QQ',
      'JJ',
      'TT',
      '99',
      '88',
      '77',
      '66',
      '55',
      '44',
      '33',
      '22',
      'AKs',
      'AQs',
      'AJs',
      'ATs',
      'A9s',
      'A8s',
      'A7s',
      'A6s',
      'A5s',
      'A4s',
      'A3s',
      'A2s',
      'KQs',
      'KJs',
      'KTs',
      'K9s',
      'K8s',
      'QJs',
      'QTs',
      'Q9s',
      'JTs',
      'J9s',
      'T9s',
      '98s',
      '87s',
      'AKo',
      'AQo',
      'AJo',
      'ATo',
      'KQo',
      'KJo',
    ],
  },
  '9max': {
    UTG: ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AQs', 'AKo'],
    'UTG+1': ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AQs', 'AJs', 'KQs', 'AKo', 'AQo'],
    'UTG+2': ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', 'AKs', 'AQs', 'AJs', 'ATs', 'KQs', 'AKo', 'AQo'],
    LJ: [
      'AA',
      'KK',
      'QQ',
      'JJ',
      'TT',
      '99',
      '88',
      '77',
      'AKs',
      'AQs',
      'AJs',
      'ATs',
      'A9s',
      'KQs',
      'KJs',
      'QJs',
      'JTs',
      'AKo',
      'AQo',
      'AJo',
      'KQo',
    ],
    HJ: [
      'AA',
      'KK',
      'QQ',
      'JJ',
      'TT',
      '99',
      '88',
      '77',
      '66',
      'AKs',
      'AQs',
      'AJs',
      'ATs',
      'A9s',
      'KQs',
      'KJs',
      'KTs',
      'QJs',
      'QTs',
      'JTs',
      'AKo',
      'AQo',
      'AJo',
      'KQo',
    ],
    CO: [
      'AA',
      'KK',
      'QQ',
      'JJ',
      'TT',
      '99',
      '88',
      '77',
      '66',
      '55',
      '44',
      'AKs',
      'AQs',
      'AJs',
      'ATs',
      'A9s',
      'A8s',
      'A5s',
      'KQs',
      'KJs',
      'KTs',
      'K9s',
      'QJs',
      'QTs',
      'Q9s',
      'JTs',
      'J9s',
      'T9s',
      '98s',
      '87s',
      'AKo',
      'AQo',
      'AJo',
      'ATo',
      'KQo',
      'KJo',
      'QJo',
    ],
    BTN: [
      'AA',
      'KK',
      'QQ',
      'JJ',
      'TT',
      '99',
      '88',
      '77',
      '66',
      '55',
      '44',
      '33',
      '22',
      'AKs',
      'AQs',
      'AJs',
      'ATs',
      'A9s',
      'A8s',
      'A7s',
      'A6s',
      'A5s',
      'A4s',
      'A3s',
      'A2s',
      'KQs',
      'KJs',
      'KTs',
      'K9s',
      'K8s',
      'K7s',
      'QJs',
      'QTs',
      'Q9s',
      'Q8s',
      'JTs',
      'J9s',
      'J8s',
      'T9s',
      'T8s',
      '98s',
      '97s',
      '87s',
      '86s',
      '76s',
      '75s',
      '65s',
      '54s',
      'AKo',
      'AQo',
      'AJo',
      'ATo',
      'A9o',
      'A8o',
      'KQo',
      'KJo',
      'KTo',
      'QJo',
      'QTo',
      'JTo',
    ],
    SB: [
      'AA',
      'KK',
      'QQ',
      'JJ',
      'TT',
      '99',
      '88',
      '77',
      '66',
      '55',
      '44',
      '33',
      '22',
      'AKs',
      'AQs',
      'AJs',
      'ATs',
      'A9s',
      'A8s',
      'A7s',
      'A6s',
      'A5s',
      'A4s',
      'A3s',
      'A2s',
      'KQs',
      'KJs',
      'KTs',
      'K9s',
      'K8s',
      'QJs',
      'QTs',
      'Q9s',
      'JTs',
      'J9s',
      'T9s',
      '98s',
      '87s',
      'AKo',
      'AQo',
      'AJo',
      'ATo',
      'KQo',
      'KJo',
    ],
  },
};

const widerRecommendedAdds = {
  '6max': {
    UTG: ['66', 'A8s', 'K9s', 'Q9s', 'T9s', '98s', 'KJo'],
    HJ: ['55', '44', 'A7s', 'A6s', 'A5s', 'K9s', 'Q9s', 'J9s', '87s', 'QJo'],
    CO: [
      '33',
      '22',
      'A4s',
      'A3s',
      'A2s',
      'K8s',
      'K7s',
      'Q8s',
      'J8s',
      'T8s',
      '97s',
      '86s',
      '75s',
      '65s',
      '54s',
      'A8o',
      'KTo',
      'QTo',
      'JTo',
    ],
    BTN: [
      'K5s',
      'K4s',
      'K3s',
      'K2s',
      'Q7s',
      'Q6s',
      'J7s',
      'T7s',
      '96s',
      '85s',
      '64s',
      '53s',
      'A7o',
      'A6o',
      'A5o',
      'K9o',
      'Q9o',
      'J9o',
      'T9o',
    ],
    SB: [
      'K7s',
      'K6s',
      'K5s',
      'Q8s',
      'J8s',
      'T8s',
      '97s',
      '86s',
      '76s',
      '65s',
      '54s',
      'A8o',
      'A7o',
      'KTo',
      'QTo',
      'JTo',
    ],
  },
  '7max': {
    UTG: ['88', '77', 'A9s', 'KJs', 'QJs', 'JTs', 'AJo', 'KQo'],
    LJ: ['77', '66', 'A8s', 'KTs', 'QTs', 'T9s', '98s', 'ATo', 'KJo', 'QJo'],
    HJ: ['66', '55', '44', 'A8s', 'A7s', 'A6s', 'A5s', 'K9s', 'Q9s', 'J9s', 'T9s', '98s', 'ATo', 'KJo', 'QJo'],
    CO: [
      '44',
      '33',
      '22',
      'A6s',
      'A4s',
      'A3s',
      'A2s',
      'K8s',
      'Q8s',
      'J8s',
      'T8s',
      '76s',
      '65s',
      '54s',
      'A9o',
      'A8o',
      'KTo',
      'QTo',
      'JTo',
    ],
    BTN: [
      'K6s',
      'K5s',
      'K4s',
      'K3s',
      'K2s',
      'Q7s',
      'Q6s',
      'J7s',
      'T7s',
      '96s',
      '85s',
      '64s',
      '53s',
      'A7o',
      'A6o',
      'A5o',
      'K9o',
      'Q9o',
      'J9o',
      'T9o',
    ],
    SB: [
      'K7s',
      'K6s',
      'K5s',
      'Q8s',
      'J8s',
      'T8s',
      '97s',
      '86s',
      '76s',
      '65s',
      '54s',
      'A9o',
      'A8o',
      'KTo',
      'QJo',
      'QTo',
      'JTo',
    ],
  },
  '8max': {
    UTG: ['88', '77', 'ATs', 'KJs', 'QJs', 'AJo', 'KQo'],
    'UTG+1': ['77', 'A9s', 'KJs', 'QJs', 'JTs', 'AJo', 'KQo'],
    LJ: ['66', 'A8s', 'KTs', 'QTs', 'T9s', '98s', 'ATo', 'KJo', 'QJo'],
    HJ: ['55', '44', 'A8s', 'A7s', 'A6s', 'A5s', 'K9s', 'Q9s', 'J9s', 'T9s', '98s', 'KJo', 'QJo'],
    CO: [
      '33',
      '22',
      'A7s',
      'A6s',
      'A4s',
      'A3s',
      'A2s',
      'K8s',
      'Q8s',
      'J8s',
      'T8s',
      '76s',
      '65s',
      '54s',
      'A9o',
      'A8o',
      'KTo',
      'QTo',
      'JTo',
    ],
    BTN: [
      'K6s',
      'K5s',
      'K4s',
      'K3s',
      'K2s',
      'Q7s',
      'Q6s',
      'J7s',
      'T7s',
      '96s',
      '85s',
      '64s',
      '53s',
      'A7o',
      'A6o',
      'A5o',
      'K9o',
      'Q9o',
      'J9o',
      'T9o',
    ],
    SB: [
      'K7s',
      'K6s',
      'K5s',
      'Q8s',
      'J8s',
      'T8s',
      '97s',
      '86s',
      '76s',
      '65s',
      '54s',
      'A9o',
      'A8o',
      'KTo',
      'QJo',
      'QTo',
      'JTo',
    ],
  },
  '9max': {
    UTG: ['99', 'AJs', 'KQs', 'AQo'],
    'UTG+1': ['88', '77', 'ATs', 'KJs', 'QJs', 'AJo', 'KQo'],
    'UTG+2': ['77', 'A9s', 'KJs', 'QJs', 'JTs', 'AJo', 'KQo'],
    LJ: ['66', 'A8s', 'KTs', 'QTs', 'T9s', '98s', 'ATo', 'KJo', 'QJo'],
    HJ: ['55', '44', 'A8s', 'A7s', 'A6s', 'A5s', 'K9s', 'Q9s', 'J9s', 'T9s', '98s', 'KJo', 'QJo'],
    CO: [
      '33',
      '22',
      'A7s',
      'A6s',
      'A4s',
      'A3s',
      'A2s',
      'K8s',
      'Q8s',
      'J8s',
      'T8s',
      '76s',
      '65s',
      '54s',
      'A9o',
      'A8o',
      'KTo',
      'QTo',
      'JTo',
    ],
    BTN: [
      'K6s',
      'K5s',
      'K4s',
      'K3s',
      'K2s',
      'Q7s',
      'Q6s',
      'J7s',
      'T7s',
      '96s',
      '85s',
      '64s',
      '53s',
      'A7o',
      'A6o',
      'A5o',
      'K9o',
      'Q9o',
      'J9o',
      'T9o',
    ],
    SB: [
      'K7s',
      'K6s',
      'K5s',
      'Q8s',
      'J8s',
      'T8s',
      '97s',
      '86s',
      '76s',
      '65s',
      '54s',
      'A9o',
      'A8o',
      'KTo',
      'QJo',
      'QTo',
      'JTo',
    ],
  },
};

const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const ACTUAL_HAND_CHART_UNLOCK_HANDS = 5000;
const openRaisePositionsByTableSize = Object.fromEntries(
  Object.entries(positionsByTableSize).map(([tableSize, positions]) => [
    tableSize,
    positions.filter((position) => position !== 'BB'),
  ]),
);

function getHand(rowIndex, colIndex) {
  const row = ranks[rowIndex];
  const col = ranks[colIndex];

  if (rowIndex === colIndex) return `${row}${col}`;
  return rowIndex < colIndex ? `${row}${col}s` : `${col}${row}o`;
}

function buildActionMap({ limps = [], raises = [] }) {
  const actions = {};

  limps.forEach((hand) => {
    actions[hand] = { action: 'limp', count: 1, denominator: 1, frequency: 1 };
  });

  raises.forEach((hand) => {
    actions[hand] = { action: 'raise', count: 1, denominator: 1, frequency: 1 };
  });

  return actions;
}

function getRecommendedRaises(tableSize, position) {
  const baseRaises = recommendedRanges[tableSize]?.[position] || [];
  const extraRaises = widerRecommendedAdds[tableSize]?.[position] || [];

  return [...new Set([...baseRaises, ...extraRaises])];
}

function getCellAction(cell, defaultFrequency = 1) {
  if (typeof cell === 'string') {
    return { action: cell, frequency: 1 };
  }

  const called = Number(cell?.called || 0);
  const limped = Number(cell?.limped || 0);
  const openRaised = Number(cell?.openRaised || 0);
  const raised = Number(cell?.raised || 0);

  return {
    action: cell?.action || 'fold',
    count: Number.isFinite(cell?.count) ? cell.count : 0,
    denominator: Number.isFinite(cell?.denominator) ? cell.denominator : 0,
    folded: Number.isFinite(cell?.folded) ? cell.folded : 0,
    frequency: Number.isFinite(cell?.frequency) ? cell.frequency : defaultFrequency,
    limped: called + limped,
    raised: Math.max(openRaised, raised),
  };
}

function getActionVerb(action) {
  if (action === 'raise') return 'open raised';
  if (action === 'limp') return 'limped/called';
  return 'folded';
}

function getCellTooltip({ action, count, denominator, hand, showFrequency }) {
  if (!showFrequency) {
    return `${hand}: ${action}`;
  }

  if (!denominator) {
    return `${hand}: no hands recorded`;
  }

  return `${hand}: ${count}/${denominator} times ${getActionVerb(action)}`;
}

function getActionBreakdown(stats = {}) {
  const denominator = Number(stats.denominator || 0);
  const actions = [
    { colorClass: 'raise', count: Number(stats.raised || 0), id: 'raised', label: 'Open Raised' },
    { colorClass: 'limp', count: Number(stats.limped || 0), id: 'limped', label: 'Limped/Called' },
    { colorClass: 'fold', count: Number(stats.folded || 0), id: 'folded', label: 'Folded' },
  ];

  return actions.map((action) => ({
    ...action,
    percentage: denominator ? Math.round((action.count / denominator) * 100) : 0,
  }));
}

const HandDetailPanel = memo(function HandDetailPanel({ disabled = false, hand, onClose, position, stats, tableSize }) {
  if (!hand || !stats) {
    return (
      <aside
        className={`hand-detail-panel hand-detail-panel--empty${disabled ? ' hand-detail-panel--disabled' : ''}`}
        aria-label='Hand frequency details'
      >
        <div className='hand-detail-empty-state'>
          <Info aria-hidden='true' />
          <h3>Select a hand</h3>
          <p>
            {disabled
              ? 'No user hand data is available for this table size and position.'
              : 'Click a square in your chart to see how often you open raised, limped/called, or folded that hand.'}
          </p>
        </div>
      </aside>
    );
  }

  const denominator = Number(stats.denominator || 0);
  const played = Number(stats.raised || 0) + Number(stats.limped || 0);
  const breakdown = getActionBreakdown(stats);

  return (
    <aside className='hand-detail-panel' aria-label={`${hand} hand frequency details`}>
      <header className='hand-detail-panel__header'>
        <div>
          <span>
            {tableSize} · {position}
          </span>
          <h3>{hand}</h3>
        </div>
        <button type='button' aria-label='Close hand details' onClick={onClose}>
          <X aria-hidden='true' />
        </button>
      </header>

      <div className='hand-detail-panel__summary'>
        <span>Total dealt</span>
        <strong>{denominator.toLocaleString()}</strong>
      </div>

      <div className='hand-detail-panel__rows'>
        {breakdown.map((action) => (
          <div className='hand-detail-row' key={action.id}>
            <div className='hand-detail-row__label'>
              <i className={action.colorClass} />
              <span>{action.label}</span>
            </div>
            <strong>
              {action.count}/{denominator || 0}
            </strong>
            <div className='hand-detail-row__bar' aria-hidden='true'>
              <span className={action.colorClass} style={{ width: `${action.percentage}%` }} />
            </div>
            <small>{action.percentage}%</small>
          </div>
        ))}
      </div>

      <footer className='hand-detail-panel__footer'>
        <span>
          Played {played}/{denominator || 0} times
        </span>
        <span>
          {denominator ? `${Math.round((played / denominator) * 100)}% VPIP with this hand` : 'No frequency yet'}
        </span>
      </footer>
    </aside>
  );
});

const HandMatrix = memo(function HandMatrix({
  actions,
  defaultFoldFrequency = 1,
  emptyMessage = '',
  onHandSelect,
  selectedHand = '',
  showFrequency = false,
  subtitle,
  title,
}) {
  return (
    <section className='starting-hand-card'>
      <div className='starting-hand-card__title'>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
      <div className='starting-hand-grid' aria-label={`${title} hand chart`}>
        {ranks.flatMap((_, rowIndex) =>
          ranks.map((__, colIndex) => {
            const hand = getHand(rowIndex, colIndex);
            const { action, count, denominator, folded, frequency, limped, raised } = getCellAction(
              actions[hand],
              defaultFoldFrequency,
            );
            const alpha = Math.max(0.16, Math.min(1, frequency));
            const tooltip = getCellTooltip({ action, count, denominator, hand, showFrequency });
            const showStack = showFrequency && denominator > 0;
            const raiseRatio = showStack ? Math.max(0, Math.min(100, (raised / denominator) * 100)) : 0;
            const limpRatio = showStack ? Math.max(0, Math.min(100, (limped / denominator) * 100)) : 0;
            const foldRatio = showStack ? Math.max(0, Math.min(100, 100 - raiseRatio - limpRatio)) : 0;
            const isSelectable = Boolean(onHandSelect && showFrequency && denominator > 0);

            return (
              <span
                aria-label={tooltip}
                className={`starting-hand-cell starting-hand-cell--${action}${showStack ? ' starting-hand-cell--stacked' : ''}${isSelectable ? ' starting-hand-cell--selectable' : ''}${selectedHand === hand ? ' selected' : ''}`}
                key={`${title}-${hand}`}
                role={isSelectable ? 'button' : undefined}
                style={{
                  '--cell-alpha': alpha,
                  '--fold-ratio': `${foldRatio}%`,
                  '--limp-ratio': `${limpRatio}%`,
                  '--raise-ratio': `${raiseRatio}%`,
                }}
                tabIndex={isSelectable ? 0 : undefined}
                title={tooltip}
                onClick={isSelectable ? () => onHandSelect(hand) : undefined}
                onKeyDown={
                  isSelectable
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onHandSelect(hand);
                        }
                      }
                    : undefined
                }
              >
                {hand}
              </span>
            );
          }),
        )}
      </div>
      {emptyMessage && <div className='starting-hand-empty'>{emptyMessage}</div>}
    </section>
  );
});

function getActualActionsFromSessions(sessions, position) {
  const handTotals = {};
  let totalPlayed = 0;

  sessions.forEach((session) => {
    const positionHands = session.stats?.handsByPosition?.[position] || {};

    Object.entries(positionHands).forEach(([hand, stats]) => {
      if (!handTotals[hand]) {
        handTotals[hand] = {
          dealt: 0,
          folded: 0,
          limped: 0,
          played: 0,
          raised: 0,
        };
      }

      const raised = Math.max(Number(stats?.openRaised || 0), Number(stats?.raised || 0));
      const limped = Number(stats?.limped || 0) + Number(stats?.called || 0);
      const folded = Number(stats?.folded || 0);
      const played = Number(stats?.played || 0);
      const dealt = Number(stats?.dealt || 0);

      handTotals[hand].raised += raised;
      handTotals[hand].limped += limped;
      handTotals[hand].folded += folded;
      handTotals[hand].played += played;
      handTotals[hand].dealt += dealt;
      totalPlayed += played;
    });
  });

  const handActions = {};

  Object.entries(handTotals).forEach(([hand, stats]) => {
    const denominator = stats.dealt || stats.played || stats.raised + stats.limped + stats.folded;

    const actionCounts = [
      ['raise', stats.raised],
      ['limp', stats.limped],
      ['fold', stats.folded],
    ];
    const [action, count] = actionCounts.sort((first, second) => second[1] - first[1])[0];

    if (count > 0) {
      handActions[hand] = {
        action,
        count,
        denominator,
        folded: stats.folded,
        frequency: denominator ? count / denominator : 1,
        limped: stats.limped,
        raised: stats.raised,
      };
    }
  });

  return {
    actions: handActions,
    hasData: Object.keys(handActions).length > 0,
    totalPlayed,
  };
}

function getSessionTableSize(session) {
  const tableSize = session.tableSize ?? session.stats?.tableSize ?? session.maxPlayers ?? session.numPlayers;
  const numericSize = Number.parseInt(tableSize, 10);

  if (Number.isFinite(numericSize)) return `${numericSize}max`;
  if (typeof tableSize === 'string') return tableSize.toLowerCase();
  return null;
}

function getUploadedHands(session) {
  return Number(session.hands ?? session.handsPlayed ?? session.stats?.handsPlayed ?? 0) || 0;
}

const HandChartsPage = () => {
  const [selectedPosition, setSelectedPosition] = useState('BTN');
  const [selectedTableSize, setSelectedTableSize] = useState('6max');
  const [hasSelectedTableSize, setHasSelectedTableSize] = useState(false);
  const [selectedHand, setSelectedHand] = useState('');
  const { data: sessions = [] } = useSessions();
  const tableSizeCounts = useMemo(
    () =>
      sessions.reduce((counts, session) => {
        const tableSize = getSessionTableSize(session);
        if (tableSizes.includes(tableSize)) {
          counts[tableSize] = (counts[tableSize] || 0) + 1;
        }
        return counts;
      }, {}),
    [sessions],
  );
  const uploadedHandsByTableSize = useMemo(
    () =>
      sessions.reduce((counts, session) => {
        const tableSize = getSessionTableSize(session);
        if (tableSizes.includes(tableSize)) {
          counts[tableSize] = (counts[tableSize] || 0) + getUploadedHands(session);
        }
        return counts;
      }, {}),
    [sessions],
  );
  const visiblePositions = useMemo(
    () =>
      openRaisePositionsByTableSize[selectedTableSize].map((positionId) => ({
        id: positionId,
        raise: getRecommendedRaises(selectedTableSize, positionId),
        title: positionTitles[positionId] || positionId,
      })),
    [selectedTableSize],
  );
  const position =
    visiblePositions.find((item) => item.id === selectedPosition) ??
    visiblePositions.find((item) => item.id === 'BTN') ??
    visiblePositions[0];
  const filteredSessions = useMemo(
    () => sessions.filter((session) => getSessionTableSize(session) === selectedTableSize),
    [selectedTableSize, sessions],
  );
  const recommendedActions = useMemo(() => buildActionMap({ raises: position.raise }), [position]);
  const sessionActions = useMemo(
    () => getActualActionsFromSessions(filteredSessions, selectedPosition),
    [filteredSessions, selectedPosition],
  );
  const actualActions = sessionActions.actions;
  const actualCount = sessionActions.totalPlayed;
  const uploadedHandCount = uploadedHandsByTableSize[selectedTableSize] || 0;
  const hasUnlockedActualHands = uploadedHandCount >= ACTUAL_HAND_CHART_UNLOCK_HANDS;
  const remainingHandsToUnlock = Math.max(0, ACTUAL_HAND_CHART_UNLOCK_HANDS - uploadedHandCount);
  const selectedHandStats = hasUnlockedActualHands && selectedHand ? actualActions[selectedHand] : null;
  const totalHands = 169;
  const actualRangeCount = Object.keys(actualActions).length;
  const actualRaiseCount = Object.values(actualActions).reduce((total, stats) => total + Number(stats.raised || 0), 0);
  const actualLimpCount = Object.values(actualActions).reduce((total, stats) => total + Number(stats.limped || 0), 0);
  const actualFoldCount = Object.values(actualActions).reduce((total, stats) => total + Number(stats.folded || 0), 0);
  const actualDecisionCount = actualRaiseCount + actualLimpCount + actualFoldCount;

  useEffect(() => {
    if (visiblePositions.some((item) => item.id === selectedPosition)) return;
    setSelectedPosition('BTN');
  }, [selectedPosition, visiblePositions]);

  useEffect(() => {
    if (hasSelectedTableSize || !sessions.length || tableSizeCounts[selectedTableSize]) return;

    const [tableSizeWithMostSessions] =
      Object.entries(tableSizeCounts).sort((first, second) => second[1] - first[1])[0] || [];

    if (tableSizeWithMostSessions) {
      setSelectedTableSize(tableSizeWithMostSessions);
    }
  }, [hasSelectedTableSize, selectedTableSize, sessions.length, tableSizeCounts]);

  useEffect(() => {
    setSelectedHand('');
  }, [selectedPosition, selectedTableSize]);

  return (
    <main className='hand-chart-page'>
      <header className='hand-chart-page__header'>
        <div>
          <h1>
            Hand Charts <Info aria-hidden='true' />
          </h1>
          <p>Select a position and compare open raises, limps/calls, and folds.</p>
        </div>
        <div className='hand-chart-header-actions'>
          <label className='hand-chart-table-size'>
            <Table2 aria-hidden='true' />
            <select
              aria-label='Hand chart table size'
              value={selectedTableSize}
              onChange={(event) => {
                setHasSelectedTableSize(true);
                setSelectedTableSize(event.target.value);
              }}
            >
              {tableSizes.map((tableSize) => (
                <option value={tableSize} key={tableSize}>
                  {tableSize}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden='true' />
          </label>

          <div className='hand-chart-summary'>
            <span>{actualCount} played hands</span>
            <strong>{Math.round((position.raise.length / totalHands) * 100)}% range</strong>
          </div>
        </div>
      </header>

      <label className='hand-chart-position-select'>
        <span>Position</span>
        <select
          aria-label='Select hand chart position'
          value={selectedPosition}
          onChange={(event) => setSelectedPosition(event.target.value)}
        >
          {visiblePositions.map((item) => (
            <option value={item.id} key={item.id}>
              {item.id} - {item.raise.length} raises
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden='true' />
      </label>

      <nav
        className='hand-chart-position-tabs'
        style={{ '--position-count': visiblePositions.length }}
        aria-label='Select position'
      >
        {visiblePositions.map((item) => (
          <button
            className={item.id === selectedPosition ? 'active' : ''}
            key={item.id}
            type='button'
            onClick={() => setSelectedPosition(item.id)}
          >
            <span>{item.id}</span>
            <small>{item.raise.length} raises</small>
          </button>
        ))}
      </nav>

      <section className='hand-chart-matrix-section'>
        <header className='hand-chart-section-header'>
          <h2>{position.title}</h2>
          <div className='starting-hand-legend'>
            <span>
              <i className='raise' />
              Raise
            </span>
            <span>
              <i className='limp' />
              Limp/Call
            </span>
            <span>
              <i className='fold' />
              Fold
            </span>
          </div>
        </header>

        <div className='hand-chart-workspace hand-chart-workspace--with-panel'>
          <div className='hand-chart-matrix-pair'>
            <HandMatrix actions={recommendedActions} title='Recommended Hand Chart' subtitle='Raise or fold' />
            <div className={`actual-hand-chart-lock${hasUnlockedActualHands ? '' : ' actual-hand-chart-lock--locked'}`}>
              <div className='actual-hand-chart-lock__content'>
                <HandMatrix
                  actions={actualActions}
                  defaultFoldFrequency={0.16}
                  emptyMessage={
                    !sessionActions.hasData
                      ? 'No hand chart data stored yet. Reupload sessions to populate actual hands played.'
                      : ''
                  }
                  selectedHand={hasUnlockedActualHands ? selectedHand : ''}
                  showFrequency
                  title='Actual Hands Played'
                  subtitle={sessionActions.hasData ? 'Click a hand for frequencies' : 'No real hand chart data yet'}
                  onHandSelect={hasUnlockedActualHands ? setSelectedHand : undefined}
                />
              </div>
              {!hasUnlockedActualHands && (
                <div className='actual-hand-chart-lock__overlay'>
                  <Lock aria-hidden='true' />
                  <strong>Unlock Actual Hands Played</strong>
                  <span>
                    5000 hands needed for hand chart, you currently have {uploadedHandCount}/{ACTUAL_HAND_CHART_UNLOCK_HANDS} at {selectedTableSize}.
                  </span>
                </div>
              )}
            </div>
          </div>

          <HandDetailPanel
            disabled={!hasUnlockedActualHands || !sessionActions.hasData}
            hand={hasUnlockedActualHands ? selectedHand : ''}
            position={position.id}
            stats={selectedHandStats}
            tableSize={selectedTableSize}
            onClose={() => setSelectedHand('')}
          />
        </div>

        <div className='hand-chart-range-strip'>
          <div>
            <span>Recommended opens</span>
            <strong>
              {position.raise.length}/{totalHands}
            </strong>
          </div>
          <div>
            <span>Hands in sample</span>
            <strong>
              {actualRangeCount}/{totalHands}
            </strong>
          </div>
          <div>
            <span>Raise frequency</span>
            <strong>
              {actualDecisionCount ? `${Math.round((actualRaiseCount / actualDecisionCount) * 100)}%` : 'N/A'}
            </strong>
          </div>
          <div>
            <span>Limp/call frequency</span>
            <strong>
              {actualDecisionCount ? `${Math.round((actualLimpCount / actualDecisionCount) * 100)}%` : 'N/A'}
            </strong>
          </div>
          <div>
            <span>Fold frequency</span>
            <strong>
              {actualDecisionCount ? `${Math.round((actualFoldCount / actualDecisionCount) * 100)}%` : 'N/A'}
            </strong>
          </div>
        </div>
      </section>

      <footer className='hand-chart-footer'>
        <span>
          {selectedTableSize} · {position.id} · {actualCount.toLocaleString()} played hands
        </span>
        <span>Actual hands show open raise, limp/call, and fold frequency by color share.</span>
      </footer>
    </main>
  );
};

export default HandChartsPage;
