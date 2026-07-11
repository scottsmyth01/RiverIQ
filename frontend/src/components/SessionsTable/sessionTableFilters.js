/*
filter()  safe, returns new array
map()     safe, returns new array
slice()   safe, returns new array
sort()    mutates, copy first
push()    mutates
splice()  mutates
*/

export function applySorting(filter, sessions) {
  switch (filter) {
    // FILTER DROPDOWN 1
    case 'newest':
      return [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));

    case 'oldest':
      return [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));

    case 'profit-high':
      return [...sessions].sort((a, b) => b.profit - a.profit);

    case 'profit-low':
      return [...sessions].sort((a, b) => a.profit - b.profit);

    case 'duration':
      return [...sessions].sort((a, b) => b.duration - a.duration);

    case 'hands':
      return [...sessions].sort((a, b) => b.hands - a.hands);
    default:
      return sessions;
  }
}

export function applyDateFilter(dateFilter, sessions) {
  const today = new Date();
  const cutoffDate = new Date(today);

  if (dateFilter === 'week') {
    cutoffDate.setDate(today.getDate() - 7);
  }
  if (dateFilter === 'month') {
    cutoffDate.setMonth(today.getMonth() - 1);
  }
  if (dateFilter === 'year') {
    cutoffDate.setFullYear(today.getFullYear() - 1);
  }
  if (dateFilter === 'all') {
    return sessions;
  }
  return sessions.filter((session) => {
    const sessionDate = new Date(session.date);
    return sessionDate >= cutoffDate && sessionDate <= today;
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
      return sessions.filter((session) => session.profit > 1);
    case 'losing':
      return sessions.filter((session) => session.profit < -1);
    case 'breakeven':
      return sessions.filter((session) => session.profit > -1 && session.profit < 1);
    default:
      return sessions;
  }
}
