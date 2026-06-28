export const calculateProfit = (sessions = [], dropdown) => {
  let totalProfit = 0;
  sessions.map((session) => {
    totalProfit += session.profit;
  });
  return totalProfit;
};

// export const calculateProfitMonthly = (sessions = []) => {
//   let totalProfit = 0;
//   sessions.map((session) => {
//     const thirtyDaysAgo = new Date();
//     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
//     if (session.date >= thirtyDaysAgo) {
//       totalProfit += value;
//     }
//   });
//   return totalProfit;
// };

// export const calculateProfitWeekly = (sessions = []) => {
//   let totalProfit = 0;
//   sessions.map((session) => {
//     totalProfit += session.profit;
//   });
//   return totalProfit;
// };
