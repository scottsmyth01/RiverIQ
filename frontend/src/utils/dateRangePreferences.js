export function getPeriodFromDefaultTimeFilter(defaultTimeFilter) {
  const periodsByDefaultTimeFilter = {
    all: 'all-time',
    '7d': 'past-7',
    '30d': 'past-30',
    '90d': 'past-90',
  };

  return periodsByDefaultTimeFilter[defaultTimeFilter] || 'all-time';
}

export function getDefaultTimeFilterFromPeriod(period) {
  const defaultTimeFiltersByPeriod = {
    'all-time': 'all',
    'past-7': '7d',
    'past-30': '30d',
    'past-90': '90d',
  };

  return defaultTimeFiltersByPeriod[period] || 'all';
}
