/*
filter()  safe, returns new array
map()     safe, returns new array
slice()   safe, returns new array
sort()    mutates, copy first
push()    mutates
splice()  mutates
*/

export function applySorting(filter, sessions) {
  const getTime = (value) => {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? null : time;
  };
  const getSessionDateTime = (session) => getTime(session.date) ?? 0;
  const getSessionDayTime = (session) => {
    const date = new Date(session.date);
    if (Number.isNaN(date.getTime())) return 0;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  };
  const getAddedTime = (session) =>
    getTime(session.createdAt) ?? getTime(session.updatedAt) ?? getSessionDateTime(session);
  const getProfit = (session) => Number(session.profit) || Number(session.stats?.profit) || 0;
  const getDuration = (session) => {
    const duration = Number(session.duration);
    return Number.isFinite(duration) ? duration : 0;
  };
  const getHands = (session) => Number(session.hands) || Number(session.stats?.handsPlayed) || 0;

  switch (filter) {
    case 'newest':
      return [...sessions].sort(
        (a, b) => getSessionDayTime(b) - getSessionDayTime(a) || getAddedTime(b) - getAddedTime(a),
      );

    case 'oldest':
      return [...sessions].sort(
        (a, b) => getSessionDayTime(a) - getSessionDayTime(b) || getAddedTime(a) - getAddedTime(b),
      );

    case 'profit-high':
      return [...sessions].sort((a, b) => getProfit(b) - getProfit(a));

    case 'profit-low':
      return [...sessions].sort((a, b) => getProfit(a) - getProfit(b));

    case 'duration':
      return [...sessions].sort((a, b) => getDuration(b) - getDuration(a));

    case 'hands':
      return [...sessions].sort((a, b) => getHands(b) - getHands(a));
    default:
      return sessions;
  }
}

export function applyDateFilter(dateFilter, sessions) {
  if (dateFilter === 'all-time') {
    return sessions;
  }

  const daysByFilter = {
    'past-7': 7,
    'past-30': 30,
    'past-90': 90,
  };
  const days = daysByFilter[dateFilter];

  if (!days) {
    return sessions;
  }

  const today = new Date();
  const cutoffDate = new Date(today);
  cutoffDate.setDate(today.getDate() - days);

  return sessions.filter((session) => {
    const sessionDate = new Date(session.date);
    return !Number.isNaN(sessionDate.getTime()) && sessionDate >= cutoffDate && sessionDate <= today;
  });
}

function normalizeTableSize(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') {
    if (/^(hu|heads[-\s]?up)$/i.test(value.trim())) return '2-Max';
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

export function getSessionTableSize(session) {
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
  return positionCount ? `${positionCount}-Max` : null;
}

export function tableSize(filter, sessions) {
  if (filter === 'all') {
    return sessions;
  }

  return sessions.filter((session) => getSessionTableSize(session) === filter);
}

export function numTables(tables, sessions) {
  if (tables === 'all') {
    return sessions;
  }

  const tableFilters = {
    one: (numTables) => numTables === 1,
    two: (numTables) => numTables === 2,
    three: (numTables) => numTables === 3,
    four: (numTables) => numTables === 4,
    'five-or-more': (numTables) => numTables >= 5,
  };

  const matchesTableFilter = tableFilters[tables];

  if (!matchesTableFilter) {
    return sessions;
  }

  return sessions.filter((session) => matchesTableFilter(Number(session.numTables)));
}

export function finish(filter, sessions) {
  switch (filter) {
    case 'all':
      return sessions;
    case 'winning':
      return sessions.filter((session) => (Number(session.profit) || Number(session.stats?.profit) || 0) > 1);
    case 'losing':
      return sessions.filter((session) => (Number(session.profit) || Number(session.stats?.profit) || 0) < -1);
    case 'breakeven':
      return sessions.filter((session) => {
        const profit = Number(session.profit) || Number(session.stats?.profit) || 0;
        return profit > -1 && profit < 1;
      });
    default:
      return sessions;
  }
}
