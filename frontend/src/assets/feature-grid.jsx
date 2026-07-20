import { BarChart3, ClipboardList, History, StickyNoteCheck, Table2, Target } from 'lucide-react';

const features = [
  {
    icon: <ClipboardList />,
    title: 'Session Tracking',
    text: 'Upload hand history files, review sessions, and edit notes or tags after every grind.',
  },
  {
    icon: <BarChart3 />,
    title: 'Dashboard Overview',
    text: 'Track profit, hands played, sessions, BB/100, and recent results by your preferred date range.',
  },
  {
    icon: <Table2 />,
    title: 'Position Analytics',
    text: 'Break down VPIP, PFR, 3Bet, 4Bet, WTSD, W$SD, aggression, c-bets, and folds by position.',
  },
  {
    icon: <StickyNoteCheck />,
    title: 'Custom Reports',
    text: 'Build reports with filters for dates, sites, stakes, game type, table size, position, and tags.',
  },
  {
    icon: <Target />,
    title: 'Goal Tracking',
    text: 'Create poker goals, track progress, filter by status or category, and keep your plan visible.',
  },
  {
    icon: <History />,
    title: 'Hand Charts',
    text: 'Compare recommended opening ranges with your actual hands once your uploaded sample is ready.',
  },
];

export default features;
