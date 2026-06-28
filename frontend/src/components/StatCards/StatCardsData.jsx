import { TrendingUp } from 'lucide-react';
import { calculateProfit } from '../../utils/Stats';

export const getStatCards = (sessions = []) => [
  {
    title: 'Total Profit',
    value: `$${calculateProfit(sessions)}`,
    icon: <TrendingUp />,
    iconColor: '#00ff37',
    iconBackground: '#1E2B2E',
  },
];
