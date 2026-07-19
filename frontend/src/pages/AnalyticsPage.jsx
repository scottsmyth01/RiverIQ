import './AnalyticsPage.css';
import { allPositions, positionsByTableSize, tableSizes } from '../utils/analytics/positions';
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { CalendarDays, ChevronDown, Table2 } from 'lucide-react';
import { datePeriods } from '../utils/analytics/datePeriods';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { getPeriodFromDefaultTimeFilter } from '../utils/dateRangePreferences';
import { positionGoalRanges } from '../utils/analytics/positionGoalRanges';
import { statKeys } from '../utils/analytics/statKeys';
import { useAuth } from '../hooks/useAuth';
import { useSessions } from '../hooks/useSessions';
import { toNumber, getStatValue, getByPosition } from '../utils/analytics/helpers';

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
  });

  return Object.values(positionAccumulators)
    .map(finalizePositionStats)
    .filter((stat) => stat.hands > 0);
}

function getTableSizeFromPositions(positions) {
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

function getMatrixColor(value, max) {
  if (!isNumber(value)) return 'var(--analytics-empty-cell)';
  const percentage = Number(value) / max;

  if (percentage < 0.25) return '#dc2626';
  if (percentage < 0.72) return '#f97316';
  return '#facc15';
}

function getMatrixTextColor(value, max) {
  if (!isNumber(value)) return undefined;
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

function getMetricStatus(value, min, max) {
  return value >= min && value <= max ? 'good' : 'warning';
}

function getProgress(value, max) {
  return Math.min(96, Math.max(8, Math.round((value / max) * 100)));
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
  Steal: 'How often you open-raise from CO, BTN, or SB when the action folds to you.',
  FSteal: 'How often you fold from the blinds after facing a steal attempt from late position.',
  CBet: 'How often you bet the flop after being the preflop aggressor.',
  FCBet: 'How often you fold when facing a flop continuation bet.',
  TBet: 'How often you bet the turn after continuation betting the flop.',
  FTBet: 'How often you fold on the turn after facing a second barrel.',
  AF: 'Postflop aggression ratio. Bets and raises compared with calls.',
  WTSD: 'Went To Showdown. How often you reach showdown after seeing the flop.',
  'W$SD': 'Won Money at Showdown. How often you win when the hand reaches showdown.',
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
    buildMetric('PFR', profile.position === 'BB' ? 'N/A' : profile.pfr, '%', profile.position === 'BB' ? null : goals.pfr, 44),
    buildMetric('3Bet', profile.threeBet, '%', goals.threeBet, 13),
    buildMetric('F3Bet', profile.foldToThreeBet, '%', goals.foldToThreeBet, 70),
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
    .filter((metric) => metric.hasMeter && metric.status === 'warning')
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
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#f59e0b',
  '#eab308',
  '#16a34a',
  '#14b8a6',
  '#0ea5e9',
  '#ef4444',
];

const AnalyticsPage = () => {
  const { user } = useAuth();
  const defaultPeriod = getPeriodFromDefaultTimeFilter(user?.preferences?.defaultTimeFilter);
  const [activePosition, setActivePosition] = useState('Overall');
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);
  const [selectedTableSize, setSelectedTableSize] = useState(user?.preferences?.defaultTableSize || '9max');
  const [leakPage, setLeakPage] = useState(0);
  const positionNames = positionsByTableSize[selectedTableSize];

  const {
    data: sessions = [],
    isLoading,
    error,
  } = useSessions({
    period: selectedPeriod,
  });
  const { data: allSessions = [] } = useSessions();

  const availableTableSizes = useMemo(() => getAvailableTableSizes(allSessions), [allSessions]);
  const positionStats = getPositionStatsFromSessions(sessions);
  const currentPositionStats = positionStats.filter((stat) => positionNames.includes(stat.position));
  const overallProfile = getOverallProfile(currentPositionStats);
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
  const threeBetMatrix = getThreeBetMatrixFromSessions(sessions);
  const threeBetMatrixMax = Math.max(
    1,
    ...positionNames.flatMap((rowPosition) =>
      positionNames
        .filter((columnPosition) => canThreeBetOpener(rowPosition, columnPosition, positionNames))
        .map((columnPosition) => threeBetMatrix[rowPosition]?.[columnPosition])
        .filter(isNumber),
    ),
  );
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

  const barData = {
    labels: currentPositionStats.map((item) => item.position),
    datasets: [
      {
        data: currentPositionStats.map((item) => item.winRate),
        backgroundColor: currentPositionStats.map((item) => {
          if (activePosition !== 'Overall' && item.position !== activePosition) {
            return item.winRate >= 0 ? 'rgba(69, 189, 87, 0.28)' : 'rgba(227, 73, 67, 0.28)';
          }

          return item.winRate >= 0 ? '#45bd57' : '#e34943';
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
      <header className='analytics-header'>
        <div>
          <h1>Analytics</h1>
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
                    {tableSize}
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
              {datePeriods.map((period) => (
                <option value={period.value} key={period.value}>
                  {period.label}
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

      <div className='analytics-grid analytics-grid--top'>
        <MetricPanel title={`Preflop ${activeProfile.position}`} stats={selectedPreflopStats} />
        <MetricPanel title={`Postflop ${activeProfile.position}`} stats={selectedPostflopStats} />

        <article className='analytics-panel analytics-position-chart'>
          <h2>{selectedTableSize} Position Win Rate (bb/100)</h2>
          <div className='analytics-bar-chart'>
            <Bar
              data={barData}
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                resizeDelay: 100,
                plugins: { legend: { display: false }, tooltip: sharedTooltip },
                scales: {
                  x: {
                    min: -10,
                    max: 15,
                    ticks: { color: chartTextColor },
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
        </article>
      </div>

      <div className='analytics-grid analytics-grid--middle'>
        <PositionRatePanel
          title='Open Raise % by Position'
          stats={currentPositionStats}
          activePosition={activePosition}
        />
        <MatrixPanel
          title={`${selectedTableSize} 3Bet vs Open by Position`}
          max={threeBetMatrixMax}
          matrix={threeBetMatrix}
          positionNames={positionNames}
        />

        <article className='analytics-panel analytics-donut-panel'>
          <h2>Profit by Position</h2>
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
                <strong>
                  {totalProfit < 0 ? '-' : ''}$
                  {Math.abs(totalProfit).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </strong>
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
                    {item.displayValue < 0 ? '-' : ''}$
                    {Math.abs(item.displayValue).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </strong>
                </div>
              ))}
            </div>
          </div>
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

function PositionRatePanel({ title, stats, activePosition }) {
  const openRaiseValues = stats.filter((stat) => stat.position !== 'BB').map((stat) => stat.pfr).filter(isNumber);
  const maxOpenRaise = openRaiseValues.length ? Math.max(...openRaiseValues) : 0;
  const progressMax = Math.max(1, Math.ceil(maxOpenRaise * 1.15));

  return (
    <article className='analytics-panel analytics-position-rate-panel'>
      <h2>{title}</h2>
      <div className='analytics-position-rate-list'>
        {stats.map((stat) => {
          const isMuted = activePosition !== 'Overall' && stat.position !== activePosition;
          const hasOpenRaise = stat.position !== 'BB' && isNumber(stat.pfr);

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
    </article>
  );
}

function MatrixPanel({ title, max, matrix, positionNames }) {
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
                      style={{ background: getMatrixColor(value, max), color: getMatrixTextColor(value, max) }}
                      key={`${rowPosition}-${columnPosition}`}
                    >
                      {isNumber(value) ? `${value}%` : 'N/A'}
                    </span>
                  );
                })}
              </Fragment>
            ))}
          </div>
          <div className='analytics-matrix-scale'>
            <span>0%</span>
            <div />
            <span>{max.toFixed(1)}%</span>
          </div>
        </>
      )}
    </article>
  );
}

export default AnalyticsPage;
