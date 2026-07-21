import './SessionStatsPage.css';

import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { ArrowLeft, BadgeDollarSign, Clock3, FileText, Gauge, Layers3, Pencil } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { useSessions } from '../hooks/useSessions';
import { getByPosition, toNumber } from '../utils/analytics/helpers';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip);

const overviewStats = [
  { key: 'handsPlayed', label: 'Hands', format: 'integer' },
  { key: 'profit', label: 'Profit', format: 'currency' },
  { key: 'allInEV', label: 'All-In EV', format: 'currency' },
  { key: 'bb100', label: 'BB/100', format: 'decimal' },
  { key: 'vpip', label: 'VPIP', format: 'percent' },
  { key: 'pfr', label: 'PFR', format: 'percent' },
  { key: 'threeBet', label: '3Bet', format: 'percent' },
  { key: 'foldToThreeBet', label: 'Fold to 3Bet', format: 'percent' },
  { key: 'fourBet', label: '4Bet', format: 'percent' },
  { key: 'foldToFourBet', label: 'Fold to 4Bet', format: 'percent' },
  { key: 'steal', label: 'Steal', format: 'percent' },
  { key: 'foldToSteal', label: 'Fold to Steal', format: 'percent' },
  { key: 'cBet', label: 'CBet', format: 'percent' },
  { key: 'foldToCBet', label: 'Fold to CBet', format: 'percent' },
  { key: 'turnCBet', label: 'Turn CBet', format: 'percent' },
  { key: 'foldToTurnCBet', label: 'Fold to Turn CBet', format: 'percent' },
  { key: 'wtsd', label: 'WTSD', format: 'percent' },
  { key: 'wsd', label: 'W$SD', format: 'percent' },
  { key: 'aggressionFactor', label: 'Aggression Factor', format: 'decimal' },
];

const preflopKeys = ['vpip', 'pfr', 'threeBet', 'foldToThreeBet', 'fourBet', 'foldToFourBet', 'steal', 'foldToSteal'];
const postflopKeys = ['cBet', 'foldToCBet', 'turnCBet', 'foldToTurnCBet', 'wtsd', 'wsd'];
const positionOrder = ['SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN'];
const positionColors = ['#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#f97316', '#eab308', '#14b8a6', '#06b6d4', '#ef4444'];

function formatDate(date) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return 'Unknown date';

  return parsedDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDuration(duration) {
  const minutesTotal = Number(duration);

  if (!Number.isFinite(minutesTotal)) return 'N/A';

  const hours = Math.floor(minutesTotal / 60);
  const minutes = minutesTotal % 60;

  return `${hours}h ${minutes}m`;
}

function formatValue(value, format = 'decimal') {
  if (value === null || value === undefined || value === '') return 'N/A';

  const number = Number(value);

  if (!Number.isFinite(number)) return 'N/A';
  if (format === 'integer') return number.toLocaleString('en-US');
  if (format === 'currency') return `${number < 0 ? '-' : ''}$${Math.abs(number).toFixed(2)}`;
  if (format === 'percent') return `${number.toFixed(1)}%`;

  return number.toFixed(2);
}

function getStat(stats, key) {
  return toNumber(stats?.[key]);
}

function getNullableStat(stats, key) {
  const value = stats?.[key];

  if (value === null || value === undefined || value === '') return null;

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function getObjectEntries(value) {
  if (!value) return [];
  if (value instanceof Map) return Array.from(value.entries());
  return Object.entries(value);
}

function getPercentage(count, total) {
  if (!total) return null;
  return Number(((count / total) * 100).toFixed(1));
}

function getNumberTone(value) {
  if (value === null || value === undefined || value === '') return '';

  const number = Number(value);

  if (!Number.isFinite(number)) return '';

  return number >= 0 ? 'positive' : 'negative';
}

function getPositionRowsFromHandCharts(stats = {}) {
  return getObjectEntries(stats.handsByPosition)
    .map(([position, hands]) => {
      const totals = getObjectEntries(hands).reduce(
        (summary, [, handStats]) => ({
          dealt: summary.dealt + toNumber(handStats?.dealt),
          played: summary.played + toNumber(handStats?.played),
          openRaised: summary.openRaised + toNumber(handStats?.openRaised),
          raised: summary.raised + toNumber(handStats?.raised),
          folded: summary.folded + toNumber(handStats?.folded),
        }),
        { dealt: 0, played: 0, openRaised: 0, raised: 0, folded: 0 },
      );

      return {
        position,
        hands: totals.dealt,
        profit: null,
        bb100: null,
        vpip: getPercentage(totals.played, totals.dealt),
        pfr: getPercentage(totals.openRaised, totals.dealt),
        threeBet: getPercentage(totals.raised - totals.openRaised, totals.dealt),
        cBet: null,
        aggressionFactor: null,
      };
    })
    .filter((row) => row.hands > 0);
}

function getPositionRows(stats = {}) {
  const byPosition = getByPosition(stats);
  const rows = Object.entries(byPosition)
    .map(([position, positionStats]) => ({
      position,
      hands: getStat(positionStats, 'handsPlayed'),
      profit: getNullableStat(positionStats, 'profit'),
      bb100: getNullableStat(positionStats, 'bb100'),
      vpip: getNullableStat(positionStats, 'vpip'),
      pfr: getNullableStat(positionStats, 'pfr'),
      threeBet: getNullableStat(positionStats, 'threeBet'),
      cBet: getNullableStat(positionStats, 'cBet'),
      aggressionFactor: getNullableStat(positionStats, 'aggressionFactor'),
    }))
    .filter((row) => row.hands > 0);

  return (rows.length ? rows : getPositionRowsFromHandCharts(stats))
    .sort((a, b) => positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position));
}

function getChartColors() {
  const styles = getComputedStyle(document.documentElement);

  return {
    text: styles.getPropertyValue('--text-table') || '#d8dee6',
    grid: styles.getPropertyValue('--border-row-alpha') || '#25313e',
  };
}

function EmptyState({ children }) {
  return <div className='session-stats-empty-panel'>{children}</div>;
}

function PositionBreakdown({ positionRows }) {
  return (
    <section className='session-stats-panel session-stats-position-panel'>
      <div className='session-stats-panel-title'>
        <Layers3 aria-hidden='true' />
        <h2>Position Breakdown</h2>
      </div>
      {positionRows.length ? (
        <div className='session-stats-table-wrap'>
          <table className='session-stats-table'>
            <thead>
              <tr>
                <th>Position</th>
                <th>Hands</th>
                <th>Profit</th>
                <th>BB/100</th>
                <th>VPIP</th>
                <th>PFR</th>
                <th>3Bet</th>
                <th>CBet</th>
                <th>AF</th>
              </tr>
            </thead>
            <tbody>
              {positionRows.map((row) => (
                  <tr key={row.position}>
                    <td>{row.position}</td>
                    <td>{formatValue(row.hands, 'integer')}</td>
                    <td className={getNumberTone(row.profit)}>{formatValue(row.profit, 'currency')}</td>
                    <td className={getNumberTone(row.bb100)}>{formatValue(row.bb100)}</td>
                    <td>{formatValue(row.vpip, 'percent')}</td>
                  <td>{formatValue(row.pfr, 'percent')}</td>
                  <td>{formatValue(row.threeBet, 'percent')}</td>
                  <td>{formatValue(row.cBet, 'percent')}</td>
                  <td>{formatValue(row.aggressionFactor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState>No position breakdown available for this session yet.</EmptyState>
      )}
    </section>
  );
}

const SessionStatsPage = () => {
  const { id } = useParams();
  const { data: sessions = [], isLoading, error } = useSessions();
  const session = sessions.find((item) => item._id === id || item.id === id);

  if (isLoading) {
    return (
      <main className='session-stats-page'>
        <div className='session-stats-empty'>Loading stats...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className='session-stats-page'>
        <div className='session-stats-empty'>{error.message}</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className='session-stats-page'>
        <div className='session-stats-empty'>
          <h1>Session not found</h1>
          <Link to='/dashboard/sessions'>Back to Sessions</Link>
        </div>
      </main>
    );
  }

  const stats = session.stats || {};
  const positionRows = getPositionRows(stats);
  const chartColors = getChartColors();
  const profit = Number(session.profit) || 0;
  const bb100 = Number(session.bb100 ?? session.winRate ?? stats.bb100 ?? 0);
  const hands = Number(session.hands ?? stats.handsPlayed ?? 0);
  const profitIsPositive = profit >= 0;
  const topStats = [
    {
      label: 'Profit',
      value: formatValue(profit, 'currency'),
      tone: profitIsPositive ? 'positive' : 'negative',
      icon: BadgeDollarSign,
    },
    { label: 'Hands', value: hands.toLocaleString('en-US'), icon: FileText },
    { label: 'BB/100', value: formatValue(bb100), tone: bb100 >= 0 ? 'positive' : 'negative', icon: Gauge },
    { label: 'Duration', value: formatDuration(session.duration), icon: Clock3 },
  ];
  const sharedTooltip = {
    backgroundColor: '#0f1720',
    titleColor: '#ffffff',
    bodyColor: '#d1d5db',
    borderColor: '#263545',
    borderWidth: 1,
    displayColors: false,
  };
  const preflopData = {
    labels: preflopKeys.map((key) => overviewStats.find((stat) => stat.key === key)?.label || key),
    datasets: [
      {
        data: preflopKeys.map((key) => getStat(stats, key)),
        backgroundColor: '#22c55e',
        borderRadius: 3,
        barThickness: 36,
      },
    ],
  };
  const postflopData = {
    labels: postflopKeys.map((key) => overviewStats.find((stat) => stat.key === key)?.label || key),
    datasets: [
      {
        data: postflopKeys.map((key) => getStat(stats, key)),
        backgroundColor: '#3b82f6',
        borderRadius: 3,
        barThickness: 36,
      },
    ],
  };
  const positionProfitData = {
    labels: positionRows.map((row) => row.position),
    datasets: [
      {
        data: positionRows.map((row) => Math.abs(row.profit)),
        backgroundColor: positionRows.map((_, index) => positionColors[index % positionColors.length]),
        borderWidth: 0,
        cutout: '64%',
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 100,
    plugins: { legend: { display: false }, tooltip: sharedTooltip },
    scales: {
      x: {
        ticks: { color: chartColors.text },
        grid: { display: false },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { color: chartColors.text },
        grid: { color: chartColors.grid },
        border: { display: false },
      },
    },
  };

  return (
    <main className='session-stats-page'>
      <nav className='session-stats-toolbar' aria-label='Session stats navigation'>
        <Link to='/dashboard/sessions'>
          <ArrowLeft aria-hidden='true' />
          Back to Sessions
        </Link>
      </nav>

      <header className='session-stats-header'>
        <div>
          <h1>{session.sessionName || 'Session Stats'}</h1>
          <p>
            {formatDate(session.date)} | {session.gameType || session.game || 'Unknown game'} | {session.stakes || 'N/A'}
          </p>
        </div>
        <Link to={`/dashboard/sessions/${id}`}>
          <Pencil aria-hidden='true' />
          Edit Session
        </Link>
      </header>

      <section className='session-stats-kpis' aria-label='Session highlights'>
        {topStats.map((item) => {
          const Icon = item.icon;

          return (
            <article className='session-stats-kpi' key={item.label}>
              <Icon aria-hidden='true' />
              <span>{item.label}</span>
              <strong className={item.tone || ''}>{item.value}</strong>
            </article>
          );
        })}
      </section>

      <section className='session-stats-grid'>
        <article className='session-stats-panel'>
          <h2>Preflop Profile</h2>
          <div className='session-stats-chart'>
            <Bar data={preflopData} options={chartOptions} />
          </div>
        </article>

        <article className='session-stats-panel'>
          <h2>Postflop Frequencies</h2>
          <div className='session-stats-chart'>
            <Bar data={postflopData} options={chartOptions} />
          </div>
        </article>
      </section>

      <PositionBreakdown positionRows={positionRows} />

      <section className='session-stats-grid session-stats-grid--mixed'>
        <article className='session-stats-panel'>
          <h2>Profit Weight by Position</h2>
          {positionRows.length ? (
            <div className='session-stats-donut-layout'>
              <div className='session-stats-donut'>
                <Doughnut
                  data={positionProfitData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    resizeDelay: 100,
                    plugins: { legend: { display: false }, tooltip: sharedTooltip },
                  }}
                />
                <div className='session-stats-donut-center'>
                  <span>Total</span>
                  <strong className={profitIsPositive ? 'positive' : 'negative'}>{formatValue(profit, 'currency')}</strong>
                </div>
              </div>
              <div className='session-stats-legend'>
                {positionRows.map((row, index) => (
                  <div key={row.position}>
                    <span style={{ background: positionColors[index % positionColors.length] }} />
                    <p>{row.position}</p>
                    <strong className={row.profit >= 0 ? 'positive' : 'negative'}>{formatValue(row.profit, 'currency')}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState>No position data stored for this session.</EmptyState>
          )}
        </article>

        <article className='session-stats-panel session-stats-table-panel'>
          <h2>All Stats</h2>
          <div className='session-stats-stat-list'>
            {overviewStats.map((stat) => (
              <div key={stat.key}>
                <span>{stat.label}</span>
                <strong>{formatValue(stats[stat.key], stat.format)}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

    </main>
  );
};

export default SessionStatsPage;
