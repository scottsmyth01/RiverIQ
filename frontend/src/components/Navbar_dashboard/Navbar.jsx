import { useEffect, useRef, useState } from 'react';
import { CircleHelp, ChevronDown, Lock, LogOut, Plus, Settings } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { useSessions } from '../../hooks/useSessions';
import './Navbar.css';
import logo from './logo.png';

const FREE_SESSION_LIMIT = 20;

const Navbar = () => {
  const { user, logout } = useAuth();
  const { data: sessions = [] } = useSessions();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountMenuRef = useRef(null);

  const displayName = user?.username || 'riq_user';
  const hasReachedFreeSessionLimit = user?.subscription !== 'pro' && sessions.length >= FREE_SESSION_LIMIT;
  const initials = displayName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const savedTheme = user?.preferences?.theme;

    if (!savedTheme) {
      return;
    }

    localStorage.setItem('theme', savedTheme);
    document.documentElement.dataset.theme = savedTheme;
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

  return (
    <nav className='dashboard-navbar' aria-label='Dashboard navigation'>
      <Link to='/dashboard' className='dashboard-navbar__brand' aria-label='RiverIQ dashboard'>
        <img src={logo} alt='' />

        <span>
          River<strong>IQ</strong>
        </span>
      </Link>

      <div className='dashboard-navbar__actions'>
        <Link
          className={`dashboard-navbar__new-session${hasReachedFreeSessionLimit ? ' dashboard-navbar__new-session--locked' : ''}`}
          to={hasReachedFreeSessionLimit ? '/subscription/payment' : '/dashboard/sessions/new'}
          aria-label={
            hasReachedFreeSessionLimit
              ? 'New sessions are locked. Upgrade to Pro to add more sessions.'
              : 'Add new session'
          }
          title={hasReachedFreeSessionLimit ? 'Upgrade to Pro to add more sessions' : undefined}
        >
          {hasReachedFreeSessionLimit ? <Lock aria-hidden='true' /> : <Plus aria-hidden='true' />}
          <span>New Session</span>
        </Link>

        <div className='dashboard-navbar__account' ref={accountMenuRef}>
          <button
            className='dashboard-navbar__account-trigger'
            type='button'
            aria-expanded={isAccountOpen}
            aria-haspopup='menu'
            onClick={() => setIsAccountOpen((isOpen) => !isOpen)}
          >
            <span className='dashboard-navbar__avatar'>
              {user?.avatarUrl ? <img src={user.avatarUrl} alt='' /> : initials}
            </span>
            <span className='dashboard-navbar__name'>{displayName}</span>
            <ChevronDown className={isAccountOpen ? 'open' : ''} aria-hidden='true' />
          </button>

          {isAccountOpen && (
            <div className='dashboard-navbar__menu' role='menu'>
              <Link to='/dashboard/help' role='menuitem' onClick={() => setIsAccountOpen(false)}>
                <CircleHelp aria-hidden='true' />
                Help
              </Link>
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
