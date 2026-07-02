export const calculateTotalProfit = (sessions = []) => {
  let totalProfit = 0;
  sessions.map((session) => {
    totalProfit += session.profit;
  });
  return totalProfit;
};

export const calculateMonthlyProfit = (sessions = []) => {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  let totalProfit = 0;

  const monthlySessions = sessions.filter((session) => {
    return new Date(session.date) >= thirtyDaysAgo;
  });

  monthlySessions.map((session) => {
    totalProfit += session.profit;
  });

  return totalProfit;
};
export const calculateWeeklyProfit = (sessions = []) => {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  let totalProfit = 0;

  const weeklySessions = sessions.filter((session) => {
    return new Date(session.date) >= sevenDaysAgo;
  });
  weeklySessions.map((session) => {
    totalProfit += session.profit;
  });

  return totalProfit;
};

export const calculateTotalWinRate = (sessions = []) => {
  let totalWinrate = 0;
  sessions.map((session) => {
    totalWinrate += session.bb100;
  });
  return totalWinrate;
};

export const calculateMonthlyWinRate = (sessions = []) => {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  let totalWinRate = 0;

  const monthlySessions = sessions.filter((session) => {
    return new Date(session.date) >= thirtyDaysAgo;
  });

  monthlySessions.map((session) => {
    totalWinRate += session.bb100;
  });

  return totalWinRate;
};

export const calculateWeeklyWinRate = (sessions = []) => {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  let totalWinRate = 0;

  const weeklySessions = sessions.filter((session) => {
    return new Date(session.date) >= sevenDaysAgo;
  });

  weeklySessions.map((session) => {
    totalWinRate += session.bb100;
  });

  return totalWinRate;
};

export const calculateTotalHands = (sessions) => {
  let totalHands = 0;
  sessions.map((session) => {
    totalHands += session.hands;
  });
  return totalHands;
};

export const calculateMonthlyHands = (sessions = []) => {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  let totalHands = 0;

  const monthlySessions = sessions.filter((session) => {
    return new Date(session.date) >= thirtyDaysAgo;
  });

  monthlySessions.map((session) => {
    totalHands += session.hands;
  });

  return totalHands;
};

export const calculateWeeklyHands = (sessions = []) => {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  let totalHands = 0;

  const weeklySessions = sessions.filter((session) => {
    return new Date(session.date) >= sevenDaysAgo;
  });

  weeklySessions.map((session) => {
    totalHands += session.hands;
  });

  return totalHands;
};

export const calculateTotalSessions = (sessions) => {
  return sessions.length;
};

export const calculateMonthlySessions = (sessions = []) => {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const monthlySessions = sessions.filter((session) => {
    return new Date(session.date) >= thirtyDaysAgo;
  });

  return monthlySessions.length;
};

export const calculateWeeklySessions = (sessions = []) => {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  const weeklySessions = sessions.filter((session) => {
    return new Date(session.date) >= sevenDaysAgo;
  });

  return weeklySessions.length;
};
