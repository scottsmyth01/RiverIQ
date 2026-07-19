import './Sidebar.css';
import { SidebarData } from './SidebarData';
import { CircleStar, Crown, LockKeyhole } from 'lucide-react';
import { Link, NavLink } from 'react-router';
import { useSessions } from '../../hooks/useSessions';
import { useAuth } from '../../hooks/useAuth';

const lockedItemTitles = new Set(['Analytics', 'Reports', 'Goals', 'Hand Charts']);

const Sidebar = () => {
  const { data: sessions = [] } = useSessions();
  const { user } = useAuth();
  const hasUnlockedInsights = user?.subscription === 'pro' || sessions.length >= 5;
  const navigationItems = SidebarData.filter((item) => item.title !== 'Settings');
  const settingsItem = SidebarData.find((item) => item.title === 'Settings');

  return (
    <aside className='sidebar'>
      <nav className='sidebar__nav' aria-label='Dashboard sections'>
        {navigationItems.map((item) => {
          const isLocked = lockedItemTitles.has(item.title) && !hasUnlockedInsights;

          if (isLocked) {
            return (
              <button
                className='sidebar__item sidebar__item--locked'
                disabled
                key={item.title}
                title={`Upload ${5 - sessions.length} more session${5 - sessions.length === 1 ? '' : 's'} to unlock ${item.title}`}
                type='button'
              >
                <span className='sidebar__icon'>{item.icon}</span>
                <span className='sidebar__title'>{item.title}</span>
                <span className='sidebar__lock' aria-hidden='true'>
                  <LockKeyhole />
                </span>
              </button>
            );
          }

          return (
            <NavLink
              className={({ isActive }) => `sidebar__item${isActive ? ' sidebar__item--active' : ''}`}
              end={item.link === '/dashboard'}
              key={item.title}
              to={item.link}
            >
              <span className='sidebar__icon'>{item.icon}</span>
              <span className='sidebar__title'>{item.title}</span>
            </NavLink>
          );
        })}
      </nav>

      {user?.subscription === 'pro' ? (
        <Link className='sidebar-pro-card sidebar-pro-status-card' to='/dashboard/settings' aria-label='View Pro billing'>
          <span className='sidebar-pro-card__icon sidebar-pro-status-card__icon'>
            <Crown aria-hidden='true' />
          </span>
          <span className='sidebar-pro-card__copy'>
            <strong>RiverIQ Pro</strong>
            <span>All features active.</span>
          </span>
        </Link>
      ) : (
        <Link className='sidebar-pro-card' to='/subscription/payment' aria-label='Start Pro trial'>
          <span className='sidebar-pro-card__icon'>
            <CircleStar aria-hidden='true' />
          </span>
          <span className='sidebar-pro-card__copy'>
            <strong>Want more features?</strong>
            <span>Unlock the full RiverIQ experience.</span>
          </span>
          <span className='sidebar-pro-card__action'>Go Pro Now</span>
        </Link>
      )}

      {settingsItem && (
        <NavLink
          className={({ isActive }) =>
            `sidebar__item sidebar__item--settings${isActive ? ' sidebar__item--active' : ''}`
          }
          to={settingsItem.link}
        >
          <span className='sidebar__icon'>{settingsItem.icon}</span>
          <span className='sidebar__title'>{settingsItem.title}</span>
        </NavLink>
      )}
    </aside>
  );
};

export default Sidebar;
