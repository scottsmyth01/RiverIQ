export function filterSessions(sessions = [], period = 'all-time') {
  const today = new Date();
  const periodDays = {
    'past-7': 7,
    'past-30': 30,
    'past-90': 90,
  };

  return sessions.filter((session) => {
    //grab the date from the
    const sessionDate = new Date(session.date);

    if (periodDays[period]) {
      const cutoffDate = new Date();
      cutoffDate.setDate(today.getDate() - periodDays[period]);

      return !Number.isNaN(sessionDate.getTime()) && sessionDate >= cutoffDate && sessionDate <= today;
    }

    return true;
  });
}
