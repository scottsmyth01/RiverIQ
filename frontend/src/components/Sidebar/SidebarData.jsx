import { ChartSpline, House, ClipboardList, StickyNoteCheck, Settings, Target } from 'lucide-react';

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
    link: '/dashboard/reports',
  },
  {
    title: 'Goals',
    icon: <Target />,
    link: '/dashboard/goals',
  },
  {
    title: 'Settings',
    icon: <Settings />,
    link: '/dashboard/settings',
  },
];
