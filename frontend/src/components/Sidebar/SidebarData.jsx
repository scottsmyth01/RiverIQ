import { ChartSpline, House, ClipboardList, MessageSquareText, StickyNoteCheck, Settings, Target, History } from 'lucide-react';

export const SidebarData = [
  {
    title: 'Dashboard',
    icon: <House />,
    link: '/dashboard',
  },
  {
    title: 'Sessions',
    icon: <ClipboardList />,
    link: '/dashboard/sessions',
  },
  {
    title: 'Analytics',
    icon: <ChartSpline />,
    link: '/dashboard/analytics',
  },
  {
    title: 'Reports',
    icon: <StickyNoteCheck />,
    link: '/dashboard/reports/new',
  },
  {
    title: 'Goals',
    icon: <Target />,
    link: '/dashboard/goals',
  },
  {
    title: 'Hand Charts',
    icon: <History />,
    link: '/dashboard/hand-history',
  },
  {
    title: 'Support',
    icon: <MessageSquareText />,
    link: '/dashboard/support',
    supportOnly: true,
  },
  {
    title: 'Settings',
    icon: <Settings />,
    link: '/dashboard/settings',
  },
];
