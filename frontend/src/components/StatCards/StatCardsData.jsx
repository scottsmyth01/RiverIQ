import { ClipboardPen, Star, TrendingUp } from 'lucide-react';
import { IconCards } from '@tabler/icons-react';
import {
  calculateMonthlyHands,
  calculateMonthlyProfit,
  calculateMonthlySessions,
  calculateMonthlyWinRate,
  calculateTotalHands,
  calculateTotalProfit,
  calculateTotalSessions,
  calculateTotalWinRate,
  calculateWeeklyHands,
  calculateWeeklyProfit,
  calculateWeeklySessions,
  calculateWeeklyWinRate,
} from '../../utils/Stats';

export const getStatCards = (sessions = []) => [
  {
    title: 'Total Profit',
    periods: [
      { id: 'all-time', label: 'All Time', value: calculateTotalProfit(sessions) },
      { id: 'last-month', label: 'Last Month', value: calculateMonthlyProfit(sessions) },
      { id: 'last-week', label: 'Last Week', value: calculateWeeklyProfit(sessions) },
    ],
    formatValue: (value) => `$${value.toFixed(2)}`,
    icon: <TrendingUp />,
    iconColor: '#00ff37',
    iconBackground: '#1E2B2E',
  },
  {
    title: 'Win Rate',
    periods: [
      { id: 'all-time', label: 'All Time', value: calculateTotalWinRate(sessions) },
      { id: 'last-month', label: 'Last Month', value: calculateMonthlyWinRate(sessions) },
      { id: 'last-week', label: 'Last Week', value: calculateWeeklyWinRate(sessions) },
    ],
    formatValue: (value) => `${value.toFixed(2)} bb/100`,
    icon: <Star />,
    iconColor: '#3b82f6',
    iconBackground: 'blue',
  },
  {
    title: 'Hands',
    periods: [
      { id: 'all-time', label: 'All Time', value: calculateTotalHands(sessions) },
      { id: 'last-month', label: 'Last Month', value: calculateMonthlyHands(sessions) },
      { id: 'last-week', label: 'Last Week', value: calculateWeeklyHands(sessions) },
    ],
    formatValue: (value) => value,
    icon: <IconCards />,
    iconColor: '#7b00ff',
    iconBackground: '#7c02ff61',
  },
  {
    title: 'Sessions',
    periods: [
      { id: 'all-time', label: 'All Time', value: calculateTotalSessions(sessions) },
      { id: 'last-month', label: 'Last Month', value: calculateMonthlySessions(sessions) },
      { id: 'last-week', label: 'Last Week', value: calculateWeeklySessions(sessions) },
    ],
    formatValue: (value) => value,
    icon: <ClipboardPen />,
    iconColor: '#ff0000',
    iconBackground: '#ff020260',
  },
];
