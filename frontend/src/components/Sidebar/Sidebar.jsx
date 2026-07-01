import './Sidebar.css';
import { SidebarData } from './SidebarData';
import { NavLink } from 'react-router';

const Sidebar = () => {
  return (
    <aside className='sidebar'>
      <nav className='sidebar__nav' aria-label='Dashboard sections'>
        {SidebarData.map((item) => (
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
    </aside>
  );
};

export default Sidebar;
