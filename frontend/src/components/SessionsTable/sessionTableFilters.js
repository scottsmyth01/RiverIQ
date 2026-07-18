/*
filter()  safe, returns new array
map()     safe, returns new array
slice()   safe, returns new array
sort()    mutates, copy first
push()    mutates
splice()  mutates
*/

export function applySorting(filter, sessions) {
  const getProfit = (session) => Number(session.profit) || Number(session.stats?.profit) || 0;
  const getDuration = (session) => {
    const duration = Number(session.duration);
    return Number.isFinite(duration) ? duration : 0;
  };
  const getHands = (session) => Number(session.hands) || Number(session.stats?.handsPlayed) || 0;

  switch (filter) {
    // FILTER DROPDOWN 1
    case 'newest':
      return [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));

    case 'oldest':
      return [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));

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
