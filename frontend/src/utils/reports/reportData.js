export const reportColumns = [
  { key: 'date', label: 'Session Date', type: 'text' },
  { key: 'site', label: 'Poker Site', type: 'text' },
  { key: 'stakes', label: 'Stakes', type: 'text' },
  { key: 'game', label: 'Game Type', type: 'text' },
  { key: 'tableSize', label: 'Table Size', type: 'text' },
  { key: 'hands', label: 'Hands', type: 'integer' },
  { key: 'profit', label: 'Profit ($)', type: 'currency' },
  { key: 'bb100', label: 'bb/100', type: 'rate2' },
  { key: 'vpip', label: 'VPIP', type: 'rate1' },
  { key: 'pfr', label: 'PFR', type: 'rate1' },
  { key: 'threeBet', label: '3-Bet %', type: 'rate1' },
  { key: 'foldToThreeBet', label: 'F3Bet %', type: 'rate1' },
  { key: 'fourBet', label: '4-Bet %', type: 'rate1' },
  { key: 'foldToFourBet', label: 'F4Bet %', type: 'rate1' },
  { key: 'wtsd', label: 'WTSD%', type: 'rate1' },
  { key: 'wsd', label: 'WSD%', type: 'rate1' },
];

export const savedReportsStorageKey = 'riveriq:saved-reports';

export function formatDate(date) {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return 'N/A';
  return parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function toDateInputValue(date) {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return '';
  return parsedDate.toISOString().slice(0, 10);
}

export function formatNumber(value, digits = 1) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : 'N/A';
}

export function formatCurrency(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'N/A';
  return `${number < 0 ? '-' : ''}$${Math.abs(number).toFixed(2)}`;
}

export function formatCell(value, type) {
  if (type === 'currency') return formatCurrency(value);
  if (type === 'integer') return Number(value || 0).toLocaleString();
  if (type === 'rate2') return formatNumber(value, 2);
  if (type === 'rate1') return formatNumber(value, 1);
  return value || 'N/A';
}

function normalizeTableSize(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') {
    const match = value.match(/\d+/);
    return match ? `${match[0]}-Max` : value;
  }
  const size = Number(value);
  return Number.isFinite(size) && size > 0 ? `${size}-Max` : null;
}

function getByPositionCount(byPosition) {
  if (!byPosition) return 0;
  if (byPosition instanceof Map) return byPosition.size;
  if (typeof byPosition === 'object') return Object.keys(byPosition).length;
  return 0;
}

function getTableSize(session) {
  const stats = session.stats || {};
  const explicitTableSize =
    normalizeTableSize(session.tableSize) ||
    normalizeTableSize(session.tableSizeMax) ||
    normalizeTableSize(session.maxPlayers) ||
    normalizeTableSize(session.numPlayers) ||
    normalizeTableSize(stats.tableSize) ||
    normalizeTableSize(stats.maxPlayers);

  if (explicitTableSize) return explicitTableSize;

  const positionCount = getByPositionCount(stats.byPosition);
  return positionCount ? `${positionCount}-Max` : 'N/A';
}

export function getReportRows(sessions) {
  if (!sessions.length) return [];

  return sessions.map((session) => {
    const stats = session.stats || {};
    const sessionDate = session.date || session.createdAt;

    return {
      rawDate: toDateInputValue(sessionDate),
      date: formatDate(sessionDate),
      site: session.pokerSite || session.game || 'PokerStars',
      stakes: session.stakes || 'N/A',
      game: session.gameType || 'NL Hold’em',
      tableSize: getTableSize(session),
      hands: Number(session.hands ?? stats.handsPlayed ?? 0),
      profit: Number(session.profit ?? stats.profit ?? 0),
      bb100: Number(session.bb100 ?? stats.bb100 ?? session.winRate ?? 0),
      vpip: stats.vpip,
      pfr: stats.pfr,
      threeBet: stats.threeBet,
      foldToThreeBet: stats.foldToThreeBet,
      fourBet: stats.fourBet,
      foldToFourBet: stats.foldToFourBet,
      wtsd: stats.wtsd,
      wsd: stats.wsd,
    };
  });
}

export function rowMatchesReportFilters(row, filters) {
  if (filters.dateRange !== 'All Time') {
    const rowTime = new Date(row.rawDate).getTime();
    if (Number.isNaN(rowTime)) return false;

    if (filters.dateRange === 'Past 30 Days' || filters.dateRange === 'Past 90 Days') {
      const days = filters.dateRange === 'Past 30 Days' ? 30 : 90;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      if (rowTime < cutoff.getTime()) return false;
    }

    if (filters.dateRange === 'Custom Range') {
      if (filters.startDate && rowTime < new Date(`${filters.startDate}T00:00:00`).getTime()) return false;
      if (filters.endDate && rowTime > new Date(`${filters.endDate}T23:59:59`).getTime()) return false;
    }
  }

  if (filters.site !== 'All Sites' && row.site !== filters.site) return false;
  if (filters.game !== 'All Games' && row.game !== filters.game) return false;
  if (filters.stakes !== 'All Stakes' && row.stakes !== filters.stakes) return false;
  if (filters.tableSizes?.length && !filters.tableSizes.includes(row.tableSize)) return false;
  return true;
}

export function getSavedReports() {
  try {
    return JSON.parse(localStorage.getItem(savedReportsStorageKey) || '[]');
  } catch {
    return [];
  }
}

export function saveReport(report) {
  const reports = getSavedReports();
  const nextReport = {
    ...report,
    id: report.id || crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
  };
  const existingIndex = reports.findIndex((savedReport) => savedReport.id === nextReport.id);
  const nextReports =
    existingIndex >= 0
      ? reports.map((savedReport) => (savedReport.id === nextReport.id ? nextReport : savedReport))
      : [nextReport, ...reports];

  localStorage.setItem(savedReportsStorageKey, JSON.stringify(nextReports));
  return nextReport;
}

export function deleteSavedReport(reportId) {
  const nextReports = getSavedReports().filter((report) => report.id !== reportId);
  localStorage.setItem(savedReportsStorageKey, JSON.stringify(nextReports));
  return nextReports;
}
