import { useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CloudUpload,
  CreditCard,
  DollarSign,
  Monitor,
  Moon,
  Sun,
  Table2,
  User,
} from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import './SettingsPage.css';

const dateRangeOptions = [
  { label: 'All Time', value: 'all' },
  { label: 'Past 7 Days', value: '7d' },
  { label: 'Past 30 Days', value: '30d' },
  { label: 'Past 90 Days', value: '90d' },
];

const currencyOptions = [
  { label: 'USD', value: 'USD' },
  { label: 'CAD', value: 'CAD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'GBP', value: 'GBP' },
];

const tableSizeOptions = [
  { label: '6max', value: '6max' },
  { label: '7max', value: '7max' },
  { label: '8max', value: '8max' },
  { label: '9max', value: '9max' },
];

const SettingsPage = () => {
  const { user, updatePreferences } = useAuth();
  const [theme, setTheme] = useState(() => user?.preferences?.theme || localStorage.getItem('theme') || 'light');
  const [dateRange, setDateRange] = useState(user?.preferences?.defaultTimeFilter || '30d');
  const [tableSize, setTableSize] = useState(user?.preferences?.defaultTableSize || '9max');
  const [currency, setCurrency] = useState(user?.preferences?.currency || 'USD');
  const [openMenu, setOpenMenu] = useState(null);
  const [savingControl, setSavingControl] = useState(null);
  const [autoDetectSite, setAutoDetectSite] = useState(true);
  const [importUnknownHands, setImportUnknownHands] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState('');
  const menuRef = useRef(null);

  const selectedDateRange = dateRangeOptions.find((option) => option.value === dateRange) || dateRangeOptions[2];
  const selectedTableSize = tableSizeOptions.find((option) => option.value === tableSize) || tableSizeOptions[3];
  const selectedCurrency = currencyOptions.find((option) => option.value === currency) || currencyOptions[0];
  const isPro = user?.subscription === 'pro';

  async function savePreference(key, value, onOptimisticChange, onRevert) {
    const controlId = `${key}:${value}`;
    const previousValue = onOptimisticChange(value);

    setSavingControl(controlId);

    try {
      await updatePreferences({ [key]: value });
    } catch {
      onRevert(previousValue);
    } finally {
      setSavingControl((currentControl) => (currentControl === controlId ? null : currentControl));
    }
  }

  function handleThemeChange(nextTheme) {
    if (nextTheme === theme) return;

    savePreference(
      'theme',
      nextTheme,
      (value) => {
        const previousTheme = theme;
        localStorage.setItem('theme', value);
        document.documentElement.dataset.theme = value;
        setTheme(value);
        return previousTheme;
      },
      (previousTheme) => {
        localStorage.setItem('theme', previousTheme);
        document.documentElement.dataset.theme = previousTheme;
        setTheme(previousTheme);
      },
    );
  }

  function handleDateRangeChange(nextDateRange) {
    setOpenMenu(null);
    if (nextDateRange === dateRange) return;

    savePreference(
      'defaultTimeFilter',
      nextDateRange,
      (value) => {
        const previousDateRange = dateRange;
        setDateRange(value);
        return previousDateRange;
      },
      setDateRange,
    );
  }

  function handleCurrencyChange(nextCurrency) {
    setOpenMenu(null);
    if (nextCurrency === currency) return;

    savePreference(
      'currency',
      nextCurrency,
      (value) => {
        const previousCurrency = currency;
        setCurrency(value);
        return previousCurrency;
      },
      setCurrency,
    );
  }

  function handleTableSizeChange(nextTableSize) {
    setOpenMenu(null);
    if (nextTableSize === tableSize) return;

    savePreference(
      'defaultTableSize',
      nextTableSize,
      (value) => {
        const previousTableSize = tableSize;
        setTableSize(value);
        return previousTableSize;
      },
      setTableSize,
    );
  }

  useEffect(() => {
    const preferences = user?.preferences;
    if (!preferences) return;

    setTheme(preferences.theme || 'light');
    setDateRange(preferences.defaultTimeFilter || '30d');
    setTableSize(preferences.defaultTableSize || '9max');
    setCurrency(preferences.currency || 'USD');
  }, [user?.preferences]);

  useEffect(() => {
    const closeMenu = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

  return (
    <section className='settings-page'>
      <header className='settings-header'>
        <h1>Settings</h1>
        <p>Manage your account and preferences.</p>
      </header>

      <div className='settings-stack'>
        <section className='settings-card'>
          <div className='settings-card__header'>
            <Monitor aria-hidden='true' />
            <div>
              <h2>Appearance</h2>
              <p>Choose how RiverIQ looks for you.</p>
            </div>
          </div>

          <div className='settings-row'>
            <div className='settings-row__copy'>
              <h3>Theme</h3>
              <p>Select your preferred theme.</p>
            </div>

            <div className='theme-segmented' aria-label='Theme options'>
              <button
                className={`theme-segmented__option${theme === 'light' ? ' theme-segmented__option--active' : ''}`}
                type='button'
                aria-pressed={theme === 'light'}
                disabled={savingControl === 'theme:light'}
                onClick={() => handleThemeChange('light')}
              >
                <Sun aria-hidden='true' />
                <span>Light</span>
              </button>
              <button
                className={`theme-segmented__option${theme === 'dark' ? ' theme-segmented__option--active' : ''}`}
                type='button'
                aria-pressed={theme === 'dark'}
                disabled={savingControl === 'theme:dark'}
                onClick={() => handleThemeChange('dark')}
              >
                <Moon aria-hidden='true' />
                <span>Dark</span>
              </button>
            </div>
          </div>
        </section>

        <section className='settings-card'>
          <div className='settings-card__header'>
            <CalendarDays aria-hidden='true' />
            <div>
              <h2>Display</h2>
              <p>Customize how dates and numbers are shown.</p>
            </div>
          </div>

          <div className='settings-list' ref={menuRef}>
            <div className='settings-row'>
              <div className='settings-row__copy'>
                <h3>Default Date Range</h3>
                <p>This is the default date range for dashboards and reports.</p>
              </div>

              <div className='settings-select-wrap'>
                <button
                  className='settings-select'
                  type='button'
                  aria-expanded={openMenu === 'dateRange'}
                  aria-haspopup='listbox'
                  disabled={savingControl?.startsWith('defaultTimeFilter:')}
                  onClick={() => setOpenMenu((menu) => (menu === 'dateRange' ? null : 'dateRange'))}
                >
                  <CalendarDays aria-hidden='true' />
                  <span>{selectedDateRange.label}</span>
                  <ChevronDown aria-hidden='true' />
                </button>

                {openMenu === 'dateRange' && (
                  <div className='settings-menu' role='listbox' aria-label='Default Date Range'>
                    {dateRangeOptions.map((option) => (
                      <button
                        className={
                          option.value === dateRange ? 'settings-menu__option active' : 'settings-menu__option'
                        }
                        key={option.value}
                        type='button'
                        role='option'
                        aria-selected={option.value === dateRange}
                        onClick={() => handleDateRangeChange(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className='settings-row'>
              <div className='settings-row__copy'>
                <h3>Default Table Size</h3>
                <p>This is the default table size for position-based analytics.</p>
              </div>

              <div className='settings-select-wrap'>
                <button
                  className='settings-select'
                  type='button'
                  aria-expanded={openMenu === 'tableSize'}
                  aria-haspopup='listbox'
                  disabled={savingControl?.startsWith('defaultTableSize:')}
                  onClick={() => setOpenMenu((menu) => (menu === 'tableSize' ? null : 'tableSize'))}
                >
                  <Table2 aria-hidden='true' />
                  <span>{selectedTableSize.label}</span>
                  <ChevronDown aria-hidden='true' />
                </button>

                {openMenu === 'tableSize' && (
                  <div className='settings-menu' role='listbox' aria-label='Default Table Size'>
                    {tableSizeOptions.map((option) => (
                      <button
                        className={option.value === tableSize ? 'settings-menu__option active' : 'settings-menu__option'}
                        key={option.value}
                        type='button'
                        role='option'
                        aria-selected={option.value === tableSize}
                        onClick={() => handleTableSizeChange(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className='settings-row'>
              <div className='settings-row__copy'>
                <h3>Currency</h3>
                <p>Choose your preferred currency.</p>
              </div>

              <div className='settings-select-wrap'>
                <button
                  className='settings-select'
                  type='button'
                  aria-expanded={openMenu === 'currency'}
                  aria-haspopup='listbox'
                  disabled={savingControl?.startsWith('currency:')}
                  onClick={() => setOpenMenu((menu) => (menu === 'currency' ? null : 'currency'))}
                >
                  <DollarSign aria-hidden='true' />
                  <span>{selectedCurrency.label}</span>
                  <ChevronDown aria-hidden='true' />
                </button>

                {openMenu === 'currency' && (
                  <div className='settings-menu' role='listbox' aria-label='Currency'>
                    {currencyOptions.map((option) => (
                      <button
                        className={option.value === currency ? 'settings-menu__option active' : 'settings-menu__option'}
                        key={option.value}
                        type='button'
                        role='option'
                        aria-selected={option.value === currency}
                        onClick={() => handleCurrencyChange(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className='settings-card'>
          <div className='settings-card__header'>
            <CloudUpload aria-hidden='true' />
            <div>
              <h2>Sessions &amp; Uploads</h2>
              <p>Manage how your sessions are uploaded and stored.</p>
            </div>
          </div>

          <div className='settings-list'>
            <div className='settings-row settings-row--compact'>
              <div className='settings-row__copy'>
                <h3>Auto-detect Poker Site</h3>
                <p>Automatically detect the poker site from uploaded files.</p>
              </div>

              <button
                className={`settings-toggle${autoDetectSite ? ' settings-toggle--on' : ''}`}
                type='button'
                aria-label={`Auto-detect Poker Site ${autoDetectSite ? 'on' : 'off'}`}
                aria-pressed={autoDetectSite}
                onClick={() => setAutoDetectSite((isEnabled) => !isEnabled)}
              >
                <span />
              </button>
            </div>

            <div className='settings-row settings-row--compact'>
              <div className='settings-row__copy'>
                <h3>Import Unknown Hands</h3>
                <p>Import hands that cannot be parsed with lower confidence.</p>
              </div>

              <button
                className={`settings-toggle${importUnknownHands ? ' settings-toggle--on' : ''}`}
                type='button'
                aria-label={`Import Unknown Hands ${importUnknownHands ? 'on' : 'off'}`}
                aria-pressed={importUnknownHands}
                onClick={() => setImportUnknownHands((isEnabled) => !isEnabled)}
              >
                <span />
              </button>
            </div>
          </div>
        </section>

        <section className='settings-card'>
          <div className='settings-card__header'>
            <CreditCard aria-hidden='true' />
            <div>
              <h2>Billing</h2>
              <p>View and manage your RiverIQ subscription.</p>
            </div>
          </div>

          <div className='settings-row settings-row--subscription'>
            <div className='settings-row__copy'>
              <h3>Current Subscription</h3>
              <p>{isPro ? 'You have access to all RiverIQ Pro features.' : 'Upgrade to unlock every RiverIQ feature.'}</p>
            </div>

            <div className='subscription-panel'>
              <span className={`subscription-badge${isPro ? ' subscription-badge--pro' : ''}`}>
                {isPro ? 'Pro' : 'Free'}
              </span>

              {isPro ? (
                <button className='subscription-action subscription-action--secondary' type='button'>
                  Cancel Subscription
                </button>
              ) : (
                <Link className='subscription-action subscription-action--primary' to='/subscription/payment'>
                  Go Pro Now
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className='settings-card settings-card--account'>
          <div className='settings-card__header'>
            <User aria-hidden='true' />
            <div>
              <h2>Account</h2>
              <p>Manage your account.</p>
            </div>
          </div>

          <button
            className='account-action'
            type='button'
            onClick={() => setPasswordNotice('Password changes will be added here next.')}
          >
            <span>
              <strong>Change Password</strong>
              <small>Update your account password.</small>
            </span>
            <ChevronRight aria-hidden='true' />
          </button>
          {passwordNotice && <p className='settings-inline-note'>{passwordNotice}</p>}
        </section>
      </div>

      <footer className='settings-support'>
        Need help? Contact us at <a href='mailto:support@riveriq.com'>support@riveriq.com</a>
      </footer>
    </section>
  );
};

export default SettingsPage;
