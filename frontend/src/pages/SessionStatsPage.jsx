import './SessionStatsPage.css';

import { ArrowLeft, BadgeDollarSign, Clock3, FileText, Gauge, Layers3, Pencil, Sigma } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { useSessions } from '../hooks/useSessions';
import { getByPosition, toNumber } from '../utils/analytics/helpers';
import { getSessionBigBlind } from '../utils/sessionUnits';

const positionOrder = ['SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN'];
const preflopStats = [
  { key: 'vpip', label: 'VPIP' },
  { key: 'pfr', label: 'PFR' },
  { key: 'threeBet', label: '3Bet' },
  { key: 'foldToThreeBet', label: 'Fold to 3Bet' },
  { key: 'fourBet', label: '4Bet' },
  { key: 'foldToFourBet', label: 'Fold to 4Bet' },
  { key: 'steal', label: 'Steal' },
  { key: 'foldToSteal', label: 'Fold to Steal' },
];

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
  if (format === 'bigBlinds') return `${number > 0 ? '+' : ''}${number.toFixed(1)} BB`;
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

  return (rows.length ? rows : getPositionRowsFromHandCharts(stats)).sort(
    (a, b) => positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position),
  );
}

function EmptyState({ children }) {
  return <div className='session-stats-empty-panel'>{children}</div>;
}

function PreflopStats({ stats }) {
  return (
    <section className='session-stats-panel session-stats-preflop-panel'>
      <div className='session-stats-panel-title'>
        <Gauge aria-hidden='true' />
        <h2>Preflop Stats</h2>
      </div>
      <div className='session-stats-preflop-grid'>
        {preflopStats.map((stat) => (
          <article className='session-stats-preflop-card' key={stat.key}>
            <span>{stat.label}</span>
            <strong>{formatValue(getNullableStat(stats, stat.key), 'percent')}</strong>
          </article>
        ))}
      </div>
    </section>
  );
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
  const profit = Number(session.profit) || 0;
  const bb100 = Number(session.bb100 ?? session.winRate ?? stats.bb100 ?? 0);
  const allInEV = Number(session.allInEV ?? stats.allInEV);
  const bigBlind = getSessionBigBlind(session);
  const allInEvBb = Number.isFinite(allInEV) && bigBlind > 0 ? allInEV / bigBlind : null;
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
    {
      label: 'All-in EV',
      value: formatValue(allInEvBb, 'bigBlinds'),
      tone: allInEvBb === null ? '' : allInEvBb >= 0 ? 'positive' : 'negative',
      icon: Sigma,
    },
    { label: 'Duration', value: formatDuration(session.duration), icon: Clock3 },
  ];

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
            {formatDate(session.date)} | {session.gameType || session.game || 'Unknown game'} |{' '}
            {session.stakes || 'N/A'}
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

      <PreflopStats stats={stats} />

      <PositionBreakdown positionRows={positionRows} />
    </main>
  );
};

export default SessionStatsPage;
