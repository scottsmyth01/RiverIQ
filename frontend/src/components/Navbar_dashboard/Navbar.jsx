import { useEffect, useRef, useState } from 'react';
import { CircleHelp, ChevronDown, Lock, LogOut, Minus, Plus, Settings, Wallet } from 'lucide-react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { useSessions } from '../../hooks/useSessions';
import { formatCurrency, getPreferredCurrency } from '../../utils/currency';
import './Navbar.css';
import logo from './logo.png';

const FREE_SESSION_LIMIT = 20;

const Navbar = () => {
  const { user, logout, updateBankroll, updateBankrollLoading } = useAuth();
  const { data: sessions = [] } = useSessions();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isBankrollOpen, setIsBankrollOpen] = useState(false);
  const [bankrollAction, setBankrollAction] = useState('deposit');
  const [bankrollAmount, setBankrollAmount] = useState('');
  const accountMenuRef = useRef(null);
  const bankrollMenuRef = useRef(null);

  const displayName = user?.username || 'riq_user';
  const hasReachedFreeSessionLimit = user?.subscription !== 'pro' && sessions.length >= FREE_SESSION_LIMIT;
  const bankroll = Number(user?.bankroll) || 0;
  const currency = getPreferredCurrency(user);
  const formattedBankroll = formatCurrency(bankroll, currency);
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
      if (!bankrollMenuRef.current?.contains(event.target)) {
        setIsBankrollOpen(false);
      }
    };
    document.addEventListener('mousedown', closeAccountMenu);
    return () => document.removeEventListener('mousedown', closeAccountMenu);
  }, []);

  async function handleBankrollSubmit(event) {
    event.preventDefault();

    try {
      await updateBankroll({
        action: bankrollAction,
        amount: bankrollAmount,
      });
      toast.success(bankrollAction === 'deposit' ? 'Bankroll deposit added' : 'Bankroll withdrawal saved');
      setBankrollAmount('');
      setIsBankrollOpen(false);
    } catch (error) {
      toast.error(error.message || 'Could not update bankroll');
    }
  }

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

        <div className='dashboard-navbar__bankroll' ref={bankrollMenuRef}>
          <div className='dashboard-navbar__bankroll-value'>
            <Wallet aria-hidden='true' />
            <span>{formattedBankroll}</span>
            <button
              className='dashboard-navbar__bankroll-add'
              type='button'
              aria-label='Deposit or withdraw bankroll'
              aria-expanded={isBankrollOpen}
              aria-haspopup='true'
              onClick={() => setIsBankrollOpen((isOpen) => !isOpen)}
            >
              <Plus aria-hidden='true' />
            </button>
          </div>

          {isBankrollOpen && (
            <form className='dashboard-navbar__bankroll-menu' onSubmit={handleBankrollSubmit}>
              <div className='dashboard-navbar__bankroll-tabs' role='group' aria-label='Bankroll action'>
                <button
                  className={bankrollAction === 'deposit' ? 'active' : ''}
                  type='button'
                  onClick={() => setBankrollAction('deposit')}
                >
                  <Plus aria-hidden='true' />
                  Deposit
                </button>
                <button
                  className={bankrollAction === 'withdraw' ? 'active' : ''}
                  type='button'
                  onClick={() => setBankrollAction('withdraw')}
                >
                  <Minus aria-hidden='true' />
                  Withdraw
                </button>
              </div>
              <label>
                <span>Amount</span>
                <input
                  type='number'
                  min='0.01'
                  step='0.01'
                  inputMode='decimal'
                  required
                  value={bankrollAmount}
                  placeholder='0.00'
                  onChange={(event) => setBankrollAmount(event.target.value)}
                />
              </label>
              <button className='dashboard-navbar__bankroll-submit' type='submit' disabled={updateBankrollLoading}>
                {updateBankrollLoading ? 'Saving...' : bankrollAction === 'deposit' ? 'Add Funds' : 'Withdraw'}
              </button>
            </form>
          )}
        </div>

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
