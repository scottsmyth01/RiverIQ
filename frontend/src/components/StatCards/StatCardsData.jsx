import { ClipboardPen, Star, TrendingUp } from 'lucide-react';
import { IconCards } from '@tabler/icons-react';

function parseBigBlind(stakes) {
  if (!stakes) return null;

  const amounts = String(stakes).match(/\d+(?:\.\d+)?/g)?.map(Number).filter((amount) => Number.isFinite(amount));
  return amounts?.length ? amounts.at(-1) : null;
}

function getSessionBbWon(session) {
  const profit = Number(session.profit) || 0;
  const bigBlind = parseBigBlind(session.stakes);

  if (bigBlind > 0) {
    return profit / bigBlind;
  }

  const hands = Number(session.hands) || Number(session.stats?.handsPlayed) || 0;
  const bb100 = Number(session.bb100 ?? session.stats?.bb100 ?? session.winRate);

  return hands > 0 && Number.isFinite(bb100) ? (bb100 * hands) / 100 : 0;
}

export const getStatCards = (sessions = []) => {
  const totalProfit = sessions.reduce((sum, session) => {
    return sum + (Number(session.profit) || 0);
  }, 0);

  const totalHands = sessions.reduce((sum, session) => {
    return sum + (Number(session.hands) || Number(session.stats?.handsPlayed) || 0);
  }, 0);

  const totalSessions = sessions.length;

  const totalBbWon = sessions.reduce((sum, session) => {
    return sum + getSessionBbWon(session);
  }, 0);

  const bb100 = totalHands > 0 ? (totalBbWon / totalHands) * 100 : 0;

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
