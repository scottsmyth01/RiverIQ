import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, LogOut, Moon, MoonIcon, Plus, Settings, SunIcon } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import './Navbar.css';
import logo from './logo.png';

const Navbar = () => {
  const { user, logout, updatePreferences } = useAuth();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const accountMenuRef = useRef(null);

  const displayName = user?.username || 'riq_user';
  const initials = displayName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function toggleTheme() {
    const previousTheme = theme;
    const nextTheme = previousTheme === 'dark' ? 'light' : 'dark';

    localStorage.setItem('theme', nextTheme);
    setTheme(nextTheme);

    try {
      await updatePreferences({ theme: nextTheme });
    } catch {
      localStorage.setItem('theme', previousTheme);
      setTheme(previousTheme);
    }
  }

  useEffect(() => {
    const savedTheme = user?.preferences?.theme;

    if (!savedTheme) {
      return;
    }

    localStorage.setItem('theme', savedTheme);
    setTheme(savedTheme);
  }, [user?.preferences?.theme]);

  useEffect(() => {
    const closeAccountMenu = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setIsAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', closeAccountMenu);
    return () => document.removeEventListener('mousedown', closeAccountMenu);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <nav className='dashboard-navbar' aria-label='Dashboard navigation'>
      <Link to='/dashboard' className='dashboard-navbar__brand' aria-label='RiverIQ dashboard'>
        <img src={logo} alt='' />
        <span>
          River<strong>IQ</strong>
        </span>
      </Link>

      <div className='dashboard-navbar__actions'>
        <Link className='dashboard-navbar__new-session' to='/dashboard/sessions/new'>
          <Plus aria-hidden='true' />
          <span>New Session</span>
        </Link>

        {theme === 'light' && (
          <button className='dashboard-navbar__theme-toggle' type='button' onClick={toggleTheme}>
            <MoonIcon />
          </button>
        )}

        {theme === 'dark' && (
          <button
            className='dashboard-navbar__theme-toggle'
            style={{ color: 'white' }}
            type='button'
            aria-label='Notifications'
            onClick={toggleTheme}
          >
            <SunIcon />
          </button>
        )}

        <div className='dashboard-navbar__account' ref={accountMenuRef}>
          <button
            className='dashboard-navbar__account-trigger'
            type='button'
            aria-expanded={isAccountOpen}
            aria-haspopup='menu'
            onClick={() => setIsAccountOpen((isOpen) => !isOpen)}
          >
            <span className='dashboard-navbar__avatar'>{initials}</span>
            <span className='dashboard-navbar__name'>{displayName}</span>
            <ChevronDown className={isAccountOpen ? 'open' : ''} aria-hidden='true' />
          </button>

          {isAccountOpen && (
            <div className='dashboard-navbar__menu' role='menu'>
              <Link to='/dashboard/settings' role='menuitem' onClick={() => setIsAccountOpen(false)}>
                <Settings aria-hidden='true' />
                Settings
              </Link>
              <button type='button' role='menuitem' onClick={() => logout()}>
                <LogOut aria-hidden='true' />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
