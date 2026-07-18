import { ClipboardPen, Star, TrendingUp } from 'lucide-react';
import { IconCards } from '@tabler/icons-react';

export const getStatCards = (sessions = []) => {
  const totalProfit = sessions.reduce((sum, session) => {
    return sum + (Number(session.profit) || 0);
  }, 0);

  const totalHands = sessions.reduce((sum, session) => {
    return sum + (Number(session.hands) || Number(session.stats?.handsPlayed) || 0);
  }, 0);

  const totalSessions = sessions.length;

  const bb100 = totalHands > 0 ? (totalProfit / 0.1 / totalHands) * 100 : 0;

  return [
    {
      title: 'Total Profit',
      value: totalProfit,
      formatValue: (value) => `$${value.toFixed(2)}`,
      icon: <TrendingUp />,
      iconColor: '#00ff37',
    },
    {
      title: 'Win Rate',
      value: bb100,
      formatValue: (value) => `${value.toFixed(2)} bb/100`,
      icon: <Star />,
      iconColor: '#3b82f6',
    },
    {
      title: 'Hands',
      value: totalHands,
      formatValue: (value) => value,
      icon: <IconCards />,
      iconColor: '#7b00ff',
    },
    {
      title: 'Sessions',
      value: totalSessions,
      formatValue: (value) => value,
      icon: <ClipboardPen />,
      iconColor: '#ff0000',
    },
  ];
};
