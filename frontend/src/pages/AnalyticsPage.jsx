import './AnalyticsPage.css';
import { allPositions, formatTableSizeLabel, positionsByTableSize, tableSizes } from '../utils/analytics/positions';
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { CalendarDays, ChevronDown, Gauge, LoaderCircle, Table2 } from 'lucide-react';
import { datePeriods } from '../utils/analytics/datePeriods';
import { filterSessions } from '../utils/filterSessions';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { getPeriodFromDefaultTimeFilter } from '../utils/dateRangePreferences';
import { positionGoalRanges } from '../utils/analytics/positionGoalRanges';
import { statKeys } from '../utils/analytics/statKeys';
import LoadingScreen from '../components/LoadingScreen/LoadingScreen';
import { useAuth } from '../hooks/useAuth';
import { useSessions } from '../hooks/useSessions';
import { toNumber, getStatValue, getByPosition } from '../utils/analytics/helpers';
import { convertFromUsd, formatCurrency, getCurrencySymbol, getPreferredCurrency } from '../utils/currency';
import { getSessionBigBlind, getSessionBbWon } from '../utils/sessionUnits';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip);

function createPositionAccumulator(position) {
  return {
    position,
    hands: 0,
    netWon: 0,
    weightedStats: statKeys.reduce((stats, key) => ({ ...stats, [key]: 0 }), {}),
    statHands: statKeys.reduce((stats, key) => ({ ...stats, [key]: 0 }), {}),
  };
}

function addPositionStats(accumulator, stats = {}) {
  const hands = toNumber(stats.handsPlayed);

  accumulator.hands += hands;
  accumulator.netWon += toNumber(stats.profit);

  statKeys.forEach((key) => {
    const value = getStatValue(stats[key]);

    if (value === null) return;

    accumulator.weightedStats[key] += value * hands;
    accumulator.statHands[key] += hands;
  });
}

function applySessionProfitAdjustment(positionAccumulators, session, byPosition = {}) {
  const adjustment = toNumber(session.profitAdjustment);

  if (!adjustment) return;

  const positions = Object.entries(byPosition)
    .map(([position, stats]) => ({
      position,
      hands: toNumber(stats?.handsPlayed),
    }))
    .filter((item) => item.hands > 0 && positionAccumulators[item.position]);
  const totalHands = positions.reduce((sum, item) => sum + item.hands, 0);

  if (!totalHands) return;

  positions.forEach((item) => {
    positionAccumulators[item.position].netWon += adjustment * (item.hands / totalHands);
  });
}

function finalizePositionStats(accumulator) {
  const weightedAverage = (key) => {
    if (!accumulator.statHands[key]) return 'N/A';
    return roundStat(accumulator.weightedStats[key] / accumulator.statHands[key]);
  };

  return {
    position: accumulator.position,
    hands: accumulator.hands,
    vpip: weightedAverage('vpip'),
    pfr: weightedAverage('pfr'),
    winRate: weightedAverage('bb100'),
    threeBet: weightedAverage('threeBet'),
    foldToThreeBet: weightedAverage('foldToThreeBet'),
    fourBet: weightedAverage('fourBet'),
    foldToFourBet: weightedAverage('foldToFourBet'),
    steal: weightedAverage('steal'),
    foldToSteal: weightedAverage('foldToSteal'),
    cBet: weightedAverage('cBet'),
    foldCBet: weightedAverage('foldToCBet'),
    turnCBet: weightedAverage('turnCBet'),
    foldToTurnCBet: weightedAverage('foldToTurnCBet'),
    wtsd: weightedAverage('wtsd'),
    wsd: weightedAverage('wsd'),
    aggressionFactor: weightedAverage('aggressionFactor'),
    netWon: Number(accumulator.netWon.toFixed(2)),
  };
}

function getPositionStatsFromSessions(sessions) {
  const positionAccumulators = allPositions
    .filter((position) => position !== 'Overall')
    .reduce((positions, position) => ({ ...positions, [position]: createPositionAccumulator(position) }), {});

  sessions.forEach((session) => {
    const byPosition = getByPosition(session.stats);

    Object.entries(byPosition).forEach(([position, stats]) => {
      if (!positionAccumulators[position]) {
        positionAccumulators[position] = createPositionAccumulator(position);
      }

      addPositionStats(positionAccumulators[position], stats);
    });

    applySessionProfitAdjustment(positionAccumulators, session, byPosition);
  });

  return Object.values(positionAccumulators)
    .map(finalizePositionStats)
    .filter((stat) => stat.hands > 0);
}

function getTableSizeFromPositions(positions) {
  if (positions.length === 2 && positions.includes('BTN') && positions.includes('BB')) return 'HU';
  if (positions.includes('UTG+2')) return '9max';
  if (positions.includes('UTG+1')) return '8max';
  if (positions.includes('LJ')) return '7max';
  if (positions.length > 0) return '6max';
  return null;
}

function getAvailableTableSizes(sessions) {
  return sessions.reduce((availableTableSizes, session) => {
    const positions = Object.keys(getByPosition(session.stats));
    const tableSize = getTableSizeFromPositions(positions);

    if (tableSize) {
      availableTableSizes.add(tableSize);
    }

    return availableTableSizes;
  }, new Set());
}

const threeBetHeatBuckets = [
  { label: '0-6%', min: 0, max: 6, color: '#fde047' },
  { label: '7-11%', min: 6, max: 11, color: '#f97316' },
  { label: '12%+', min: 11, max: Infinity, color: '#ef4444' },
];

function getMatrixColor(value, isPossibleCell = true) {
  if (!isPossibleCell) return '#172234';
  if (!isNumber(value)) return '#243244';

  return threeBetHeatBuckets.find((bucket) => value >= bucket.min && value <= bucket.max)?.color || '#ef4444';
}

function getMatrixTextColor(value) {
  if (!isNumber(value)) return '#a8b3c2';
  return '#ffffff';
}

function getMatrixCellValue(cell) {
  if (isNumber(cell)) return cell;
  if (isNumber(cell?.percentage)) return cell.percentage;
  return null;
}

function canThreeBetOpener(openerPosition, threeBettorPosition, positionNames) {
  const openerIndex = positionNames.indexOf(openerPosition);
  const threeBettorIndex = positionNames.indexOf(threeBettorPosition);

  return openerIndex !== -1 && threeBettorIndex !== -1 && threeBettorIndex > openerIndex;
}

function getMatrixEntries(value) {
  if (!value) return [];
  if (value instanceof Map) return Array.from(value.entries());
  return Object.entries(value);
}

function getThreeBetMatrixFromSessions(sessions) {
  const matrix = {};

  sessions.forEach((session) => {
    const threeBetVsOpen = session.stats?.threeBetVsOpen || {};

    getMatrixEntries(threeBetVsOpen).forEach(([openerPosition, matchups]) => {
      if (!matrix[openerPosition]) {
        matrix[openerPosition] = {};
      }

      getMatrixEntries(matchups).forEach(([threeBettorPosition, cell]) => {
        const value = getMatrixCellValue(cell);
        const opportunities = toNumber(cell?.opportunities);
        const threeBets = toNumber(cell?.threeBets);

        if (!matrix[openerPosition][threeBettorPosition]) {
          matrix[openerPosition][threeBettorPosition] = {
            opportunities: 0,
            threeBets: 0,
            weightedValue: 0,
            valueHands: 0,
          };
        }

        const accumulator = matrix[openerPosition][threeBettorPosition];

        if (opportunities > 0) {
          accumulator.opportunities += opportunities;
          accumulator.threeBets += threeBets;
          return;
        }

        if (value !== null) {
          accumulator.weightedValue += value;
          accumulator.valueHands += 1;
        }
      });
    });
  });

  return Object.entries(matrix).reduce((rows, [openerPosition, matchups]) => {
    rows[openerPosition] = Object.entries(matchups).reduce((columns, [threeBettorPosition, accumulator]) => {
      if (accumulator.opportunities > 0) {
        columns[threeBettorPosition] = Number(((accumulator.threeBets / accumulator.opportunities) * 100).toFixed(1));
      } else if (accumulator.valueHands > 0) {
        columns[threeBettorPosition] = Number((accumulator.weightedValue / accumulator.valueHands).toFixed(1));
      }

      return columns;
    }, {});

    return rows;
  }, {});
}

function roundStat(value) {
  return Number(value.toFixed(1));
}

function isNumber(value) {
  return typeof value === 'number' && !Number.isNaN(value);
}

function getOverallProfile(stats) {
  const hands = stats.reduce((sum, stat) => sum + stat.hands, 0);
  const weightedAverage = (key) => {
    const statHands = stats.reduce((sum, stat) => (isNumber(stat[key]) ? sum + stat.hands : sum), 0);

    if (!statHands) return 'N/A';

    return stats.reduce((sum, stat) => (isNumber(stat[key]) ? sum + stat[key] * stat.hands : sum), 0) / statHands;
  };
  const roundedAverage = (key) => {
    const average = weightedAverage(key);
    return isNumber(average) ? roundStat(average) : average;
  };

  return {
    position: 'Overall',
    hands,
    vpip: roundedAverage('vpip'),
    pfr: roundedAverage('pfr'),
    winRate: roundedAverage('winRate'),
    threeBet: roundedAverage('threeBet'),
    foldToThreeBet: roundedAverage('foldToThreeBet'),
    fourBet: roundedAverage('fourBet'),
    foldToFourBet: roundedAverage('foldToFourBet'),
    steal: roundedAverage('steal'),
    foldToSteal: roundedAverage('foldToSteal'),
    cBet: roundedAverage('cBet'),
    foldCBet: roundedAverage('foldCBet'),
    turnCBet: roundedAverage('turnCBet'),
    foldToTurnCBet: roundedAverage('foldToTurnCBet'),
    wtsd: roundedAverage('wtsd'),
    wsd: roundedAverage('wsd'),
    aggressionFactor: roundedAverage('aggressionFactor'),
    netWon: stats.reduce((sum, stat) => sum + stat.netWon, 0),
  };
}

function getOverallProfileFromSessions(sessions, fallbackPositionStats = []) {
  if (!sessions.length) {
    return getOverallProfile(fallbackPositionStats);
  }

  const weightedAverage = (sessionKey) => {
    const totals = sessions.reduce(
      (accumulator, session) => {
        const value = getSessionStat(session, sessionKey);
        const hands = getSessionHands(session);

        if (!isNumber(value) || hands <= 0) return accumulator;

        accumulator.value += value * hands;
        accumulator.hands += hands;
        return accumulator;
      },
      { value: 0, hands: 0 },
    );

    return totals.hands > 0 ? roundStat(totals.value / totals.hands) : 'N/A';
  };

  return {
    position: 'Overall',
    hands: sessions.reduce((sum, session) => sum + getSessionHands(session), 0),
    vpip: weightedAverage('vpip'),
    pfr: weightedAverage('pfr'),
    winRate: weightedAverage('bb100'),
    threeBet: weightedAverage('threeBet'),
    foldToThreeBet: weightedAverage('foldToThreeBet'),
    fourBet: weightedAverage('fourBet'),
    foldToFourBet: weightedAverage('foldToFourBet'),
    steal: weightedAverage('steal'),
    foldToSteal: weightedAverage('foldToSteal'),
    cBet: weightedAverage('cBet'),
    foldCBet: weightedAverage('foldToCBet'),
    turnCBet: weightedAverage('turnCBet'),
    foldToTurnCBet: weightedAverage('foldToTurnCBet'),
    wtsd: weightedAverage('wtsd'),
    wsd: weightedAverage('wsd'),
    aggressionFactor: weightedAverage('aggressionFactor'),
    netWon: Number(
      sessions
        .reduce((sum, session) => sum + toNumber(session.profit ?? session.stats?.profit), 0)
        .toFixed(2),
    ),
  };
}

function getSessionsForTableSize(sessions, tableSize) {
  return sessions.filter((session) => {
    const positions = Object.keys(getByPosition(session.stats));
    return getTableSizeFromPositions(positions) === tableSize;
  });
}

function getMetricStatus(value, min, max) {
  return value >= min && value <= max ? 'good' : 'warning';
}

function getProgress(value, max) {
  return Math.min(96, Math.max(8, Math.round((value / max) * 100)));
}

function getSessionHands(session) {
  return toNumber(session?.hands ?? session?.stats?.handsPlayed);
}

function getSessionStat(session, key) {
  const value = session?.stats?.[key] ?? session?.[key];
  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function getSessionAllInEvBb(session) {
  if (getSessionAllInHandCount(session) <= 0) return null;

  const allInEV = Number(session?.allInEV ?? session?.stats?.allInEV);
  const bigBlind = getSessionBigBlind(session);

  return Number.isFinite(allInEV) && bigBlind > 0 ? allInEV / bigBlind : null;
}

function getSessionAllInHandCount(session) {
  return toNumber(session?.allInWinSampleSize ?? session?.stats?.allInWinSampleSize);
}

function getAllInEvSummary(sessions) {
  return sessions.reduce(
    (summary, session) => {
      const allInEvBb = getSessionAllInEvBb(session);
      const actualBb = getSessionBbWon(session);
      const hands = getSessionHands(session);
      const allInHands = getSessionAllInHandCount(session);

      if (allInEvBb !== null) {
        summary.allInEvBb += allInEvBb;
        summary.sessionsWithEv += 1;
      }

      if (actualBb !== null) {
        summary.actualBb += actualBb;
      }

      summary.hands += hands;
      summary.allInHands += allInHands;
      return summary;
    },
    { allInEvBb: 0, actualBb: 0, allInHands: 0, hands: 0, sessionsWithEv: 0 },
  );
}

function formatBigBlindValue(value, hasValue = true) {
  if (!hasValue || !Number.isFinite(value)) return 'N/A';

  return `${value > 0 ? '+' : ''}${value.toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} BB`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getPlayerStyleProfile(profile) {
  const vpip = isNumber(profile.vpip) ? profile.vpip : null;
  const aggressionFactor = isNumber(profile.aggressionFactor) ? profile.aggressionFactor : null;
  const hasStyle = vpip !== null && aggressionFactor !== null;

  if (!hasStyle) {
    return {
      aggressionFactor,
      hasStyle: false,
      label: 'Not enough data',
      note: 'Upload more hands to classify your player type.',
      vpip,
      x: 50,
      y: 50,
    };
  }

  const isLoose = vpip >= 24;
  const isAggressive = aggressionFactor >= 1.8;
  const label = `${isLoose ? 'Loose' : 'Tight'} ${isAggressive ? 'Aggressive' : 'Passive'}`;

  return {
    aggressionFactor,
    hasStyle,
    label,
    note: `${profile.position} profile based on VPIP and postflop aggression factor.`,
    vpip,
    x: clamp((vpip / 45) * 100, 5, 95),
    y: clamp((aggressionFactor / 3.5) * 100, 5, 95),
  };
}

function getPositionGoals(position) {
  return {
    ...positionGoalRanges.Overall,
    ...(positionGoalRanges[position] || {}),
  };
}

function formatGoal(range, suffix = '%') {
  if (!range) return 'N/A';
  return `${range[0]} - ${range[1]}${suffix}`;
}

const metricDescriptions = {
  VPIP: 'Voluntarily Put Money In Pot. How often you enter the pot by calling or raising before the flop.',
  PFR: 'Preflop Raise. How often you raise before the flop. Big blind open-raise spots are marked N/A.',
  '3Bet': 'How often you re-raise preflop after another player has already opened.',
  F3Bet: 'How often you fold after raising or calling preflop and then facing a 3Bet.',
  '4Bet': 'How often you re-raise again after opening and facing a 3Bet.',
  F4Bet: 'How often you fold after 3Betting and then facing a 4Bet.',
  Steal: 'How often you open-raise from CO, BTN, or SB when the action folds to you.',
  FSteal: 'How often you fold from the blinds after facing a steal attempt from late position.',
  CBet: 'How often you bet the flop after being the preflop aggressor.',
  FCBet: 'How often you fold when facing a flop continuation bet.',
  TBet: 'How often you bet the turn after continuation betting the flop.',
  FTBet: 'How often you fold on the turn after facing a second barrel.',
  AF: 'Postflop aggression ratio. Bets and raises compared with calls.',
  WTSD: 'Went To Showdown. How often you reach showdown after seeing the flop.',
  W$SD: 'Won Money at Showdown. How often you win when the hand reaches showdown.',
};

function buildMetric(label, value, suffix, range, progressMax) {
  const hasValue = typeof value === 'number' && !Number.isNaN(value);
  const hasMeter = hasValue && Boolean(range);

  return {
    label,
    description: metricDescriptions[label],
    value,
    suffix: hasValue ? suffix : '',
    goal: formatGoal(range, suffix),
    hasMeter,
    progress: hasMeter ? getProgress(value, progressMax) : 0,
    status: hasMeter ? getMetricStatus(value, range[0], range[1]) : 'good',
  };
}

function buildPreflopStats(profile) {
  const goals = getPositionGoals(profile.position);
  const hasSteal = ['CO', 'BTN', 'SB'].includes(profile.position);
  const steal = hasSteal ? profile.steal : 'N/A';
  const foldToSteal = ['SB', 'BB'].includes(profile.position) ? profile.foldToSteal : 'N/A';
  const stealGoal = hasSteal ? goals.steal : null;
  const foldToStealGoal =
    profile.position === 'SB' ? goals.foldToStealSb : profile.position === 'BB' ? goals.foldToStealBb : null;

  return [
    buildMetric('VPIP', profile.vpip, '%', goals.vpip, 52),
    buildMetric(
      'PFR',
      profile.position === 'BB' ? 'N/A' : profile.pfr,
      '%',
      profile.position === 'BB' ? null : goals.pfr,
      44,
    ),
    buildMetric('3Bet', profile.threeBet, '%', goals.threeBet, 13),
    buildMetric('F3Bet', profile.foldToThreeBet, '%', goals.foldToThreeBet, 70),
    buildMetric('4Bet', profile.fourBet, '%', goals.fourBet, 10),
    buildMetric('F4Bet', profile.foldToFourBet, '%', goals.foldToFourBet, 70),
    buildMetric('Steal', steal, '%', stealGoal, 58),
    buildMetric('FSteal', foldToSteal, '%', foldToStealGoal, 90),
  ];
}

function buildPostflopStats(profile) {
  const goals = getPositionGoals(profile.position);

  return [
    buildMetric('CBet', profile.cBet, '%', goals.cBet, 86),
    buildMetric('FCBet', profile.foldCBet, '%', goals.foldCBet, 68),
    buildMetric('TBet', profile.turnCBet, '%', goals.turnCBet, 70),
    buildMetric('FTBet', profile.foldToTurnCBet, '%', goals.foldTurnCBet, 65),
    buildMetric('AF', profile.aggressionFactor, '', goals.riverAggression, 2.8),
    buildMetric('WTSD', profile.wtsd, '%', goals.wtsd, 36),
    buildMetric('W$SD', profile.wsd, '%', goals.wsd, 66),
  ];
}

function buildLeakCardsFromMetrics(metrics, position) {
  return metrics
    .filter((metric) => metric.hasMeter && metric.value !== 0 && metric.status === 'warning')
    .map((metric) => ({
      label: metric.label,
      value: `${metric.value}${metric.suffix}`,
      range: `Goal: ${metric.goal}`,
      status: metric.status,
      badge: 'Review',
    }));
}

function EmptyLeakTracker() {
  return (
    <div className='analytics-leak-empty'>
      <strong>No active leaks</strong>
      <p>All tracked metrics are inside their target ranges.</p>
    </div>
  );
}

const positionColors = [
  '#60a5fa',
  '#a78bfa',
  '#f472b6',
  '#2dd4bf',
  '#bef264',
  '#86efac',
  '#22d3ee',
  '#38bdf8',
  '#fb7185',
];

function getPositionProfitAxisBounds(stats) {
  const values = stats.map((stat) => Number(stat.netWon)).filter((value) => Number.isFinite(value));

  if (!values.length) {
    return { min: -10, max: 10 };
  }

  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const largestAbsValue = Math.max(Math.abs(minValue), Math.abs(maxValue), 10);
  const step = largestAbsValue >= 1000 ? 500 : largestAbsValue >= 250 ? 100 : largestAbsValue >= 100 ? 50 : 10;

  return {
    min: Math.floor(minValue / step) * step,
    max: Math.ceil(maxValue / step) * step,
  };
}

function formatWholeCurrency(value, currency) {
  const convertedValue = convertFromUsd(value, currency);

  if (!Number.isFinite(convertedValue)) return 'N/A';

  const sign = convertedValue < 0 ? '-' : '';

  return `${sign}${getCurrencySymbol(currency)}${Math.abs(Math.round(convertedValue)).toLocaleString('en-US')}`;
}

const AnalyticsPage = () => {
  const { user } = useAuth();
  const currency = getPreferredCurrency(user);
  const defaultPeriod = getPeriodFromDefaultTimeFilter(user?.preferences?.defaultTimeFilter);
  const [activePosition, setActivePosition] = useState('Overall');
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);
  const [selectedTableSize, setSelectedTableSize] = useState(user?.preferences?.defaultTableSize || '9max');
  const [leakPage, setLeakPage] = useState(0);
  const positionNames = positionsByTableSize[selectedTableSize];

  const {
    data: sessions = [],
    isLoading,
    isFetching,
    error,
  } = useSessions({
    period: selectedPeriod,
  });
  const { data: allSessions = [] } = useSessions();

  const availableTableSizes = useMemo(() => getAvailableTableSizes(allSessions), [allSessions]);
  const datePeriodsWithAvailability = useMemo(
    () =>
      datePeriods.map((period) => {
        if (period.value === 'all-time') {
          return { ...period, available: true, sessionCount: allSessions.length };
        }

        const sessionCount = filterSessions(allSessions, period.value).length;
        return { ...period, available: sessionCount > 0, sessionCount };
      }),
    [allSessions],
  );
  const positionStats = getPositionStatsFromSessions(sessions);
  const currentPositionStats = positionStats.filter((stat) => positionNames.includes(stat.position));
  const currentTableSessions = getSessionsForTableSize(sessions, selectedTableSize);
  const overallProfile = getOverallProfileFromSessions(currentTableSessions, currentPositionStats);
  const allInEvSummary = getAllInEvSummary(currentTableSessions);
  const hasAllInEv = allInEvSummary.sessionsWithEv > 0;
  const allInEvDiff = allInEvSummary.allInEvBb - allInEvSummary.actualBb;
  const selectedPositionProfile = currentPositionStats.find((stat) => stat.position === activePosition);
  const activeProfile = activePosition === 'Overall' ? overallProfile : selectedPositionProfile || overallProfile;
  const selectedPreflopStats = buildPreflopStats(activeProfile);
  const selectedPostflopStats = buildPostflopStats(activeProfile);
  const selectedLeakCards = buildLeakCardsFromMetrics(
    [...selectedPreflopStats, ...selectedPostflopStats],
    activeProfile.position,
  );

  const profitTotal = currentPositionStats.reduce((sum, item) => sum + Math.abs(item.netWon), 0);
  const profitByPosition = currentPositionStats.map((stat, index) => ({
    label: stat.position,
    value: Math.abs(stat.netWon),
    displayValue: stat.netWon,
    percentage: profitTotal > 0 ? Math.round((Math.abs(stat.netWon) / profitTotal) * 100) : 0,
    color: positionColors[index % positionColors.length],
  }));
  const totalProfit = currentPositionStats.reduce((sum, stat) => sum + stat.netWon, 0);
  const threeBetMatrix = getThreeBetMatrixFromSessions(currentTableSessions);
  const leakPageSize = 4;
  const leakPageCount = Math.ceil(selectedLeakCards.length / leakPageSize);
  const visibleLeakCards = selectedLeakCards.slice(leakPage * leakPageSize, leakPage * leakPageSize + leakPageSize);

  useEffect(() => {
    const defaultTableSize = user?.preferences?.defaultTableSize;

    if (defaultTableSize && positionsByTableSize[defaultTableSize] && availableTableSizes.has(defaultTableSize)) {
      setSelectedTableSize(defaultTableSize);
    }
  }, [availableTableSizes, user?.preferences?.defaultTableSize]);

  useEffect(() => {
    if (!availableTableSizes.size || availableTableSizes.has(selectedTableSize)) return;

    const nextAvailableTableSize = tableSizes.find((tableSize) => availableTableSizes.has(tableSize));

    if (nextAvailableTableSize) {
      setSelectedTableSize(nextAvailableTableSize);
    }
  }, [availableTableSizes, selectedTableSize]);

  useEffect(() => {
    setSelectedPeriod(defaultPeriod);
  }, [defaultPeriod]);

  useEffect(() => {
    const activePeriod = datePeriodsWithAvailability.find((period) => period.value === selectedPeriod);

    if (activePeriod && !activePeriod.available) {
      setSelectedPeriod('all-time');
    }
  }, [datePeriodsWithAvailability, selectedPeriod]);

  useEffect(() => {
    if (activePosition !== 'Overall' && !positionNames.includes(activePosition)) {
      setActivePosition('Overall');
    }
  }, [activePosition, positionNames]);

  useEffect(() => {
    setLeakPage(0);
  }, [activePosition, selectedTableSize]);

  useEffect(() => {
    setLeakPage((page) => {
      const lastPage = Math.max(0, leakPageCount - 1);
      return Math.min(page, lastPage);
    });
  }, [leakPageCount]);

  const chartTextColor = getComputedStyle(document.documentElement).getPropertyValue('--text-table') || '#d8dee6';
  const chartGridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-row-alpha') || '#25313e';
  const positionProfitAxisBounds = getPositionProfitAxisBounds(currentPositionStats);

  const barData = {
    labels: currentPositionStats.map((item) => item.position),
    datasets: [
      {
        data: currentPositionStats.map((item) => item.netWon),
        backgroundColor: currentPositionStats.map((item) => {
          if (activePosition !== 'Overall' && item.position !== activePosition) {
            return item.netWon >= 0 ? 'rgba(134, 239, 172, 0.26)' : 'rgba(251, 113, 133, 0.24)';
          }

          return item.netWon >= 0 ? '#86efac' : '#fb7185';
        }),
        borderRadius: 2,
        barThickness: 26,
      },
    ],
  };

  const doughnutData = {
    labels: profitByPosition.map((item) => item.label),
    datasets: [
      {
        data: profitByPosition.map((item) => item.value),
        backgroundColor: profitByPosition.map((item) => item.color),
        borderWidth: 0,
        cutout: '62%',
      },
    ],
  };

  const showPageLoading = isLoading;

  const sharedTooltip = {
    backgroundColor: '#0f1720',
    titleColor: '#ffffff',
    bodyColor: '#d1d5db',
    borderColor: '#263545',
    borderWidth: 1,
    displayColors: false,
  };

  return (
    <section className={`dashboard-content analytics-page analytics-page--${selectedTableSize}`}>
      {showPageLoading && <LoadingScreen />}
      <header className='analytics-header'>
        <div>
          <h1>Analytics</h1>
          <p>Break down your stats by position, table size, and date range.</p>
        </div>
        <div className='analytics-header-actions'>
          <label className='analytics-date-filter'>
            <Table2 aria-hidden='true' />
            <select
              aria-label='Analytics table size'
              value={selectedTableSize}
              onChange={(event) => setSelectedTableSize(event.target.value)}
            >
              {tableSizes.map((tableSize) => {
                const isAvailable = availableTableSizes.has(tableSize);

                return (
                  <option value={tableSize} disabled={!isAvailable} key={tableSize}>
                    {formatTableSizeLabel(tableSize)}
                    {!isAvailable ? ' (N/A)' : ''}
                  </option>
                );
              })}
            </select>
            <ChevronDown aria-hidden='true' />
          </label>
          <label className='analytics-date-filter'>
            <CalendarDays aria-hidden='true' />
            <select
              aria-label='Analytics date range'
              value={selectedPeriod}
              onChange={(event) => setSelectedPeriod(event.target.value)}
            >
              {datePeriodsWithAvailability.map((period) => (
                <option value={period.value} disabled={!period.available} key={period.value}>
                  {period.label}
                  {!period.available ? ' (N/A)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden='true' />
          </label>
        </div>
      </header>

      <div className='analytics-position-menu'>
        <h2>Position</h2>
        <div className='analytics-position-tabs' aria-label='Analytics position filter'>
          {allPositions.map((position) => {
            const isDisabled = position !== 'Overall' && !positionNames.includes(position);

            return (
              <button
                className={activePosition === position ? 'active' : ''}
                type='button'
                aria-pressed={activePosition === position}
                disabled={isDisabled}
                onClick={() => setActivePosition(position)}
                key={position}
              >
                {position}
              </button>
            );
          })}
        </div>
      </div>

      <RunStatusPanel diffBb={allInEvDiff} hasAllInEv={hasAllInEv} />
      <PlayerStylePanel profile={activeProfile} isLoading={isLoading} />

      <div className='analytics-grid analytics-grid--top'>
        <MetricPanel title={`Preflop ${activeProfile.position}`} stats={selectedPreflopStats} />
        <MetricPanel title={`Postflop ${activeProfile.position}`} stats={selectedPostflopStats} />
        <ResultsPanel
          allInEvBb={allInEvSummary.allInEvBb}
          actualBb={allInEvSummary.actualBb}
          allInHands={allInEvSummary.allInHands}
          diffBb={allInEvDiff}
          hasAllInEv={hasAllInEv}
          hands={allInEvSummary.hands}
        />

        <article className='analytics-panel analytics-position-chart'>
          <h2>Profit by Position ($)</h2>
          <ChartLoadingFrame isLoading={isLoading}>
            <div className='analytics-bar-chart'>
              <Bar
                data={barData}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  resizeDelay: 100,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      ...sharedTooltip,
                      callbacks: {
                        label: (context) => formatCurrency(context.parsed.x, currency),
                      },
                    },
                  },
                  scales: {
                    x: {
                      ...positionProfitAxisBounds,
                      ticks: {
                        color: chartTextColor,
                        callback: (value) => formatWholeCurrency(value, currency),
                      },
                      grid: { color: chartGridColor },
                      border: { display: false },
                    },
                    y: {
                      ticks: { color: chartTextColor },
                      grid: { display: false },
                      border: { display: false },
                    },
                  },
                }}
              />
            </div>
          </ChartLoadingFrame>
        </article>
      </div>

      <div className='analytics-grid analytics-grid--middle'>
        <PositionRatePanel
          title='Open Raise % by Position'
          stats={currentPositionStats}
          activePosition={activePosition}
          isLoading={isLoading}
        />
        <MatrixPanel
          title='3Bet vs Open'
          matrix={threeBetMatrix}
          positionNames={positionNames}
          isLoading={isLoading}
        />

        <article className='analytics-panel analytics-donut-panel'>
          <h2>Profit by Position</h2>
          <ChartLoadingFrame isLoading={isLoading}>
            <div className='analytics-donut-layout'>
              <div className='analytics-donut-wrap'>
                <Doughnut
                  data={doughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    resizeDelay: 100,
                    plugins: { legend: { display: false }, tooltip: sharedTooltip },
                  }}
                />
                <div className='analytics-donut-center'>
                  <span>Total</span>
                  <strong>{formatCurrency(totalProfit, currency)}</strong>
                  <span>Profit</span>
                </div>
              </div>
              <div className='analytics-donut-legend'>
                {profitByPosition.map((item) => (
                  <div className='analytics-legend-item' key={item.label}>
                    <span style={{ background: item.color }} />
                    <p>
                      {item.label} ({item.percentage}%)
                    </p>
                    <strong className={item.displayValue >= 0 ? 'positive' : 'negative'}>
                      {formatCurrency(item.displayValue, currency)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </ChartLoadingFrame>
        </article>
      </div>

      <article className='analytics-panel analytics-leak-panel'>
        <div className='analytics-leak-header'>
          <h2>Leak Tracker</h2>
          {leakPageCount > 1 && (
            <div className='analytics-leak-controls' aria-label='Leak tracker carousel controls'>
              <button
                type='button'
                disabled={leakPage === 0}
                onClick={() => setLeakPage((page) => Math.max(0, page - 1))}
                aria-label='Previous leak cards'
              >
                <ChevronDown aria-hidden='true' />
              </button>
              <span>
                {leakPage + 1} / {leakPageCount}
              </span>
              <button
                type='button'
                disabled={leakPage >= leakPageCount - 1}
                onClick={() => setLeakPage((page) => Math.min(leakPageCount - 1, page + 1))}
                aria-label='Next leak cards'
              >
                <ChevronDown aria-hidden='true' />
              </button>
            </div>
          )}
        </div>
        <div className='analytics-leak-grid'>
          {visibleLeakCards.length > 0 ? (
            visibleLeakCards.map((card) => (
              <div className={`analytics-leak-card analytics-leak-card--${card.status}`} key={card.label}>
                <div>
                  <h3>{card.label}</h3>
                  <span>{card.badge}</span>
                </div>
                <strong>{card.value}</strong>
                <p>{card.note}</p>
                <small>{card.range}</small>
              </div>
            ))
          ) : (
            <EmptyLeakTracker />
          )}
        </div>
      </article>
    </section>
  );
};

function ChartLoadingFrame({ children, isLoading }) {
  return (
    <div className={`analytics-chart-frame${isLoading ? ' analytics-chart-frame--loading' : ''}`}>
      {children}
      {isLoading && (
        <div className='analytics-chart-loader' role='status' aria-live='polite'>
          <LoaderCircle aria-hidden='true' />
          <span>Loading graph</span>
        </div>
      )}
    </div>
  );
}

function MetricPanel({ title, stats }) {
  return (
    <article className='analytics-panel analytics-metric-panel'>
      <h2>{title}</h2>
      <div className='analytics-metric-head'>
        <span />
        <span />
        <span>Goal</span>
      </div>
      <div className='analytics-metric-list'>
        {stats.map((stat) => (
          <div className='analytics-metric-row' key={stat.label}>
            <span>{stat.label}</span>
            <strong>
              {stat.value}
              {stat.suffix}
            </strong>
            <div className='analytics-meter'>
              {stat.hasMeter && (
                <span
                  className={`analytics-meter-fill analytics-meter-fill--${stat.status}`}
                  style={{ width: `${stat.progress}%` }}
                />
              )}
            </div>
            <em>{stat.goal}</em>
            {stat.description ? (
              <button className='analytics-info-button' type='button' aria-label={`${stat.label} meaning`}>
                <span aria-hidden='true'>i</span>
                <span className='analytics-info-popup' role='tooltip'>
                  {stat.description}
                </span>
              </button>
            ) : (
              <span />
            )}
          </div>
        ))}
      </div>
    </article>
  );
}

function getRunStatus(diffBb, hasAllInEv) {
  if (!hasAllInEv || !Number.isFinite(diffBb)) {
    return {
      label: 'Not enough data',
      tone: 'neutral',
      text: 'Upload hands with all-in EV data to see whether your results are ahead of or behind expectation.',
    };
  }

  if (diffBb >= 5) {
    return {
      label: 'Running Cold',
      tone: 'cold',
      text: 'Your actual results are behind your all-in EV. The decisions may be better than the short-term results look.',
    };
  }

  if (diffBb <= -5) {
    return {
      label: 'Running Hot',
      tone: 'hot',
      text: 'Your actual results are ahead of your all-in EV. Nice heater, but expect this to normalize over more hands.',
    };
  }

  return {
    label: 'Running Neutral',
    tone: 'neutral',
    text: 'Your actual results are close to your all-in EV. No major luck swing is showing in this sample.',
  };
}

function ResultsPanel({ actualBb, allInEvBb, allInHands, diffBb, hands, hasAllInEv }) {
  const resultRows = [
    { label: 'All-in EV', value: formatBigBlindValue(allInEvBb, hasAllInEv), tone: allInEvBb >= 0 ? 'positive' : 'negative' },
    { label: 'Actual', value: formatBigBlindValue(actualBb, hasAllInEv), tone: actualBb >= 0 ? 'positive' : 'negative' },
    { label: 'EV Diff', value: formatBigBlindValue(diffBb, hasAllInEv), tone: diffBb >= 0 ? 'positive' : 'negative' },
    { label: 'All-in Hands', value: allInHands.toLocaleString('en-US') },
    { label: 'Total Hands', value: hands.toLocaleString('en-US') },
  ];

  return (
    <article className='analytics-panel analytics-results-panel'>
      <h2>All-in EV (BB)</h2>
      <div className='analytics-results-list'>
        {resultRows.map((row) => (
          <div className='analytics-results-row' key={row.label}>
            <span>{row.label}</span>
            <strong className={`analytics-results-value${row.tone ? ` analytics-results-value--${row.tone}` : ''}`}>
              {row.value}
            </strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function RunStatusPanel({ diffBb, hasAllInEv }) {
  const runStatus = getRunStatus(diffBb, hasAllInEv);

  return (
    <article className='analytics-panel analytics-run-panel'>
      <div className={`analytics-run-card analytics-run-card--${runStatus.tone}`}>
        <span>Luck Check</span>
        <strong>{runStatus.label}</strong>
        <p>{runStatus.text}</p>
      </div>
    </article>
  );
}

function PlayerStylePanel({ profile, isLoading }) {
  const styleProfile = getPlayerStyleProfile(profile);
  const vpipText = styleProfile.vpip === null ? 'N/A' : `${styleProfile.vpip}%`;
  const aggressionText =
    styleProfile.aggressionFactor === null
      ? 'N/A'
      : styleProfile.aggressionFactor.toLocaleString('en-US', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });

  return (
    <article className='analytics-panel analytics-player-style-panel'>
      <div className='analytics-player-style-head'>
        <div>
          <h2>Player Type</h2>
          <p>{styleProfile.note}</p>
        </div>
        <strong>{styleProfile.label}</strong>
      </div>
      <div className={`analytics-style-frame${isLoading ? ' analytics-style-frame--loading' : ''}`}>
        <div className='analytics-style-stats'>
          <div>
            <span>VPIP</span>
            <strong>{vpipText}</strong>
            <small>Tight to loose</small>
          </div>
          <div>
            <span>AF</span>
            <strong>{aggressionText}</strong>
            <small>Passive to aggressive</small>
          </div>
        </div>
        <div className='analytics-style-map' aria-label={`Player type: ${styleProfile.label}`}>
          <span className='analytics-style-quadrant analytics-style-quadrant--top-left'>Tight Aggressive</span>
          <span className='analytics-style-quadrant analytics-style-quadrant--top-right'>Loose Aggressive</span>
          <span className='analytics-style-quadrant analytics-style-quadrant--bottom-left'>Tight Passive</span>
          <span className='analytics-style-quadrant analytics-style-quadrant--bottom-right'>Loose Passive</span>
          <span
            className='analytics-style-dot'
            style={{ left: `${styleProfile.x}%`, bottom: `${styleProfile.y}%` }}
          />
        </div>
      </div>
    </article>
  );
}

function PositionRatePanel({ title, stats, activePosition, isLoading }) {
  const openRaiseValues = stats
    .filter((stat) => stat.position !== 'BB')
    .map((stat) => stat.pfr)
    .filter(isNumber);
  const maxOpenRaise = openRaiseValues.length ? Math.max(...openRaiseValues) : 0;
  const progressMax = Math.max(1, Math.ceil(maxOpenRaise * 1.15));

  return (
    <article className='analytics-panel analytics-position-rate-panel'>
      <h2>{title}</h2>
      <ChartLoadingFrame isLoading={isLoading}>
        <div className='analytics-position-rate-list'>
          {stats.filter((stat) => stat.position !== 'BB').map((stat) => {
            const isMuted = activePosition !== 'Overall' && stat.position !== activePosition;
            const hasOpenRaise = isNumber(stat.pfr);

            return (
              <div
                className={isMuted ? 'analytics-position-rate-row muted' : 'analytics-position-rate-row'}
                key={stat.position}
              >
                <span>{stat.position}</span>
                <div className='analytics-position-rate-track'>
                  {hasOpenRaise && <span style={{ width: `${getProgress(stat.pfr, progressMax)}%` }} />}
                </div>
                <strong>{hasOpenRaise ? `${stat.pfr}%` : 'N/A'}</strong>
              </div>
            );
          })}
        </div>
      </ChartLoadingFrame>
    </article>
  );
}

function MatrixPanel({ title, matrix, positionNames, isLoading }) {
  const hasMatrixData = positionNames.some((rowPosition) =>
    positionNames.some(
      (columnPosition) =>
        canThreeBetOpener(rowPosition, columnPosition, positionNames) &&
        isNumber(getMatrixCellValue(matrix[rowPosition]?.[columnPosition])),
    ),
  );

  return (
    <article className='analytics-panel analytics-matrix-panel'>
      <h2>{title}</h2>
      <ChartLoadingFrame isLoading={isLoading}>
        {!hasMatrixData ? (
          <div className='analytics-matrix-empty'>
            <strong>No matchup data yet</strong>
            <p>Existing sessions only include aggregate 3Bet by position.</p>
          </div>
        ) : (
          <>
            <div
              className='analytics-matrix'
              style={{ gridTemplateColumns: `minmax(44px, 52px) repeat(${positionNames.length}, minmax(22px, 1fr))` }}
            >
              <span />
              {positionNames.map((column) => (
                <strong key={column}>{column}</strong>
              ))}
              {positionNames.map((rowPosition) => (
                <Fragment key={rowPosition}>
                  <strong key={`${rowPosition}-label`}>vs {rowPosition}</strong>
                  {positionNames.map((columnPosition) => {
                    const isPossibleCell = canThreeBetOpener(rowPosition, columnPosition, positionNames);
                    const value = isPossibleCell ? getMatrixCellValue(matrix[rowPosition]?.[columnPosition]) : null;

                    return (
                      <span
                        className={!isNumber(value) ? 'empty' : ''}
                        style={{
                          background: getMatrixColor(value, isPossibleCell),
                          color: getMatrixTextColor(value),
                        }}
                        key={`${rowPosition}-${columnPosition}`}
                      >
                        {isNumber(value) ? `${value}%` : 'N/A'}
                      </span>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </>
        )}
      </ChartLoadingFrame>
    </article>
  );
}

export default AnalyticsPage;
