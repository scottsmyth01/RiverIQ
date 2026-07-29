// INPUT: sessions, time period
// OUTPUT: fitlered array with sessions in specified time period

export function filterSessions(sessions = [], period = 'all-time') {
  const today = new Date();
  const periodDays = {
    'past-7': 7,
    'past-30': 30,
    'past-90': 90,
  };

  return sessions.filter((session) => {
    //grab the date from the session.date
    const sessionDate = new Date(session.date);

    // for everything except 'all-time'
    if (periodDays[period]) {
      // cutoff date is now, then subtract the number of days passed into the function (7,30,90)
      const cutoffDate = new Date();
      cutoffDate.setDate(today.getDate() - periodDays[period]);

      // return true if the date falls in this range
      return !Number.isNaN(sessionDate.getTime()) && sessionDate >= cutoffDate && sessionDate <= today;
    }

    //return true if 'all-time' since we want all of these session documents
    return true;
  });
}
