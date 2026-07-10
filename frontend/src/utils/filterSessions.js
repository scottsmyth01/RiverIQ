export function filterSessions(sessions = [], period = 'all-time') {
  const today = new Date();

  return sessions.filter((session) => {
    const sessionDate = new Date(session.date);

    if (period === 'weekly') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);

      return sessionDate >= sevenDaysAgo;
    }

    if (period === 'monthly') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      return sessionDate >= thirtyDaysAgo;
    }

    return true;
  });
}
