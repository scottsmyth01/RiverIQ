export function applyFilter(filter, currentSessions) {
  switch (filter) {
    // FILTER DROPDOWN 1
    case 'newest':
      return [...currentSessions].sort((a, b) => new Date(b.date) - new Date(a.date));

    case 'oldest':
      return [...currentSessions].sort((a, b) => new Date(a.date) - new Date(b.date));

    case 'profit-high':
      return [...currentSessions].sort((a, b) => b.profit - a.profit);

    case 'profit-low':
      return [...currentSessions].sort((a, b) => a.profit - b.profit);

    // FILTER DROPDOWN 2

    default:
      break;
  }
}
