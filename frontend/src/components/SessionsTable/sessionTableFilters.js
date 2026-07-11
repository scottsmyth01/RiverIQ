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
      break;
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
  if (dateFilter === 'all-dates') {
    return sessions;
  }
  return sessions.filter((session) => {
    const sessionDate = new Date(session.date);
    return sessionDate >= cutoffDate && sessionDate <= today;
  });
}

export function numTables() {}
