export const calculateProfit = (sessions = [], dropdown) => {
  let totalProfit = 0;
  sessions.map((session) => {
    totalProfit += session.profit;
  });
  return totalProfit;
};
