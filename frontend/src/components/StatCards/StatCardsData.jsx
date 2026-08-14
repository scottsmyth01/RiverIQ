import { ClipboardPen, Star, TrendingUp } from 'lucide-react';
import { IconCards } from '@tabler/icons-react';
import { getSessionBbWon } from '../../utils/sessionUnits';
import { formatCurrency } from '../../utils/currency';

export const getStatCards = (sessions = [], currency = 'USD') => {
  // profit calculation: dead simple, just iterate and add to sum
  const totalProfit = sessions.reduce((sum, session) => {
    return sum + (Number(session.profit) || 0);
  }, 0);

  // hands played: get num from session.stats object
  const totalHands = sessions.reduce((sum, session) => {
    return sum + Number(session.stats?.handsPlayed) || 0;
  }, 0);

  // total sessions: just the sessions array length
  const totalSessions = sessions.length;

  //bb100: totalBbWon / totalHands * 100
  const totalBbWon = sessions.reduce((sum, session) => {
    return sum + getSessionBbWon(session);
  }, 0);

  const bb100 = (totalBbWon / totalHands) * 100; //calculate BB100
  const winRate = Number.isFinite(bb100) ? bb100 : 0;

  return [
    {
      id: 'total-profit',
      title: 'Total Profit',
      value: totalProfit,
      tone: totalProfit < 0 ? 'negative' : 'positive',
      formatValue: (value) => formatCurrency(value, currency),
      icon: <TrendingUp />,
      iconColor: '#00ff37',
    },
    {
      id: 'win-rate',
      title: 'Win Rate',
      value: winRate,
      tone: winRate < 0 ? 'negative' : 'positive',
      formatValue: (value) => `${value.toFixed(2)} bb/100`,
      icon: <Star />,
      iconColor: '#3b82f6',
    },
    {
      id: 'hands',
      title: 'Hands',
      value: totalHands,
      formatValue: (value) => value,
      icon: <IconCards />,
      iconColor: '#7b00ff',
    },
    {
      id: 'sessions',
      title: 'Sessions',
      value: totalSessions,
      formatValue: (value) => value,
      icon: <ClipboardPen />,
      iconColor: '#ff0000',
    },
  ];
};

function parseBigBlind(stakes) {
  if (!stakes) return null;

  const amounts = String(stakes)
    .match(/\d+(?:\.\d+)?/g)
    ?.map(Number)
    .filter((amount) => Number.isFinite(amount));
  return amounts?.length >= 2 ? amounts[1] : amounts?.[0] ?? null;
}
