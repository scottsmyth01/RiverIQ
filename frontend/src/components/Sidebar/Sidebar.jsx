import './Sidebar.css';
import { SidebarData } from './SidebarData';
import { CircleStar, Sparkles } from 'lucide-react';
import { Link, NavLink } from 'react-router';

const Sidebar = () => {
  const navigationItems = SidebarData.filter((item) => item.title !== 'Settings');
  const settingsItem = SidebarData.find((item) => item.title === 'Settings');

  return (
    <aside className='sidebar'>
      <nav className='sidebar__nav' aria-label='Dashboard sections'>
        {navigationItems.map((item) => (
          <NavLink
            className={({ isActive }) => `sidebar__item${isActive ? ' sidebar__item--active' : ''}`}
            end={item.link === '/dashboard'}
            key={item.title}
            to={item.link}
          >
            <span className='sidebar__icon'>{item.icon}</span>
            <span className='sidebar__title'>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <Link className='sidebar-pro-card' to='/pricing' aria-label='View Pro pricing'>
        <span className='sidebar-pro-card__icon'>
          <CircleStar aria-hidden='true' />
        </span>
        <span className='sidebar-pro-card__copy'>
          <strong>Want more features?</strong>
          <span>Unlock the full RiverIQ experience.</span>
        </span>
        <span className='sidebar-pro-card__action'>Go Pro Now</span>
      </Link>

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
