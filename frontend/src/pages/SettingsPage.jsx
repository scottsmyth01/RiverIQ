import { useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  Camera,
  ChevronDown,
  ChevronRight,
  CloudUpload,
  CreditCard,
  DollarSign,
  Monitor,
  Moon,
  Save,
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
  const {
    user,
    updatePreferences,
    uploadAvatar,
    uploadAvatarLoading,
    deleteAvatar,
    deleteAvatarLoading,
    cancelSubscription,
    cancelSubscriptionLoading,
    forgotPassword,
    forgotPasswordLoading,
    updatePreferencesLoading,
  } = useAuth();
  const [theme, setTheme] = useState(() => user?.preferences?.theme || localStorage.getItem('theme') || 'light');
  const [dateRange, setDateRange] = useState(user?.preferences?.defaultTimeFilter || '30d');
  const [tableSize, setTableSize] = useState(user?.preferences?.defaultTableSize || '9max');
  const [currency, setCurrency] = useState(user?.preferences?.currency || 'USD');
  const [openMenu, setOpenMenu] = useState(null);
  const [savingControl, setSavingControl] = useState(null);
  const [autoDetectSite, setAutoDetectSite] = useState(true);
  const [importUnknownHands, setImportUnknownHands] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFileName, setAvatarFileName] = useState('');
  const [avatarNotice, setAvatarNotice] = useState('');
  const [passwordNotice, setPasswordNotice] = useState('');
  const [settingsNotice, setSettingsNotice] = useState('');
  const [subscriptionNotice, setSubscriptionNotice] = useState('');
  const avatarInputRef = useRef(null);
  const menuRef = useRef(null);

  const selectedDateRange = dateRangeOptions.find((option) => option.value === dateRange) || dateRangeOptions[2];
  const selectedTableSize = tableSizeOptions.find((option) => option.value === tableSize) || tableSizeOptions[3];
  const selectedCurrency = currencyOptions.find((option) => option.value === currency) || currencyOptions[0];
  const isPro = user?.subscription === 'pro';
  const savedPreferences = user?.preferences || {};
  const isSavingSettings = updatePreferencesLoading || savingControl === 'settings';
  const hasSettingsChanges =
    theme !== (savedPreferences.theme || 'light') ||
    dateRange !== (savedPreferences.defaultTimeFilter || '30d') ||
    tableSize !== (savedPreferences.defaultTableSize || '9max') ||
    currency !== (savedPreferences.currency || 'USD');

  function handleThemeChange(nextTheme) {
    if (nextTheme === theme) return;

    localStorage.setItem('theme', nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    setTheme(nextTheme);
    setSettingsNotice('');
  }

  function handleDateRangeChange(nextDateRange) {
    setOpenMenu(null);
    if (nextDateRange === dateRange) return;

    setDateRange(nextDateRange);
    setSettingsNotice('');
  }

  function handleCurrencyChange(nextCurrency) {
    setOpenMenu(null);
    if (nextCurrency === currency) return;

    setCurrency(nextCurrency);
    setSettingsNotice('');
  }

  function handleTableSizeChange(nextTableSize) {
    setOpenMenu(null);
    if (nextTableSize === tableSize) return;

    setTableSize(nextTableSize);
    setSettingsNotice('');
  }

  async function handleSaveSettings() {
    setSettingsNotice('');
    setSavingControl('settings');

    try {
      await updatePreferences({
        theme,
        currency,
        defaultTimeFilter: dateRange,
        defaultTableSize: tableSize,
      });
      setSettingsNotice('Settings saved successfully.');
    } catch (error) {
      setSettingsNotice(error.message || 'Could not save settings.');
    } finally {
      setSavingControl(null);
    }
  }

  async function handleCancelSubscription() {
    const shouldCancel = window.confirm('Cancel your RiverIQ Pro subscription?');

    if (!shouldCancel) return;

    setSubscriptionNotice('');

    try {
      await cancelSubscription();
      setSubscriptionNotice('Subscription canceled. Your account is now on the Free plan.');
    } catch (error) {
      setSubscriptionNotice(error.message || 'Could not cancel subscription.');
    }
  }

  async function handleSendPasswordReset() {
    setPasswordNotice('');

    if (!user?.email) {
      setPasswordNotice('No email address is available for this account.');
      return;
    }

    try {
      await forgotPassword({ email: user.email });
      setPasswordNotice(`Password reset email sent to ${user.email}.`);
    } catch (error) {
      setPasswordNotice(error.message || 'Could not send password reset email.');
    }
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarNotice('Choose an image file for your avatar.');
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarNotice('Avatar images must be smaller than 2 MB.');
      event.target.value = '';
      return;
    }

    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setAvatarFileName(file.name);
    setAvatarNotice('Uploading avatar...');

    try {
      await uploadAvatar(file);
      setAvatarNotice('Avatar uploaded successfully.');
    } catch (error) {
      setAvatarNotice(error.message || 'Could not upload avatar.');
    }
  }

  async function handleRemoveAvatar() {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarPreview('');
    setAvatarFileName('');

    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }

    if (!user?.avatarUrl && !user?.avatarKey) {
      setAvatarNotice('Avatar preview removed.');
      return;
    }

    setAvatarNotice('Removing avatar...');

    try {
      await deleteAvatar();
      setAvatarNotice('Avatar removed.');
    } catch (error) {
      setAvatarNotice(error.message || 'Could not remove avatar.');
    }
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

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  return (
    <section className='settings-page'>
      <header className='settings-header'>
        <div className='settings-header__top'>
          <div>
            <h1>Settings</h1>
            <p>Manage your account and preferences.</p>
          </div>
          <Link className='settings-header__help' to='/dashboard/help'>
            Need help?
          </Link>
        </div>
      </header>

      <div className='settings-stack'>
        <section className='settings-card settings-card--profile'>
          <div className='settings-card__header'>
            <User aria-hidden='true' />
            <div>
              <h2>Profile</h2>
              <p>Manage how your account appears in RiverIQ.</p>
            </div>
          </div>

          <div className='settings-avatar-row'>
            <div className='settings-avatar-preview' aria-label='Avatar preview'>
              {avatarPreview || user?.avatarUrl ? (
                <img src={avatarPreview || user.avatarUrl} alt='' />
              ) : (
                <span>{(user?.username || user?.name || 'RI').slice(0, 2).toUpperCase()}</span>
              )}
            </div>

            <div className='settings-avatar-copy'>
              <h3>Profile Avatar</h3>
              <p>Upload a square image under 2 MB. JPG, PNG, and WebP files work best.</p>
              {avatarFileName && <small>{avatarFileName}</small>}
            </div>

            <div className='settings-avatar-actions'>
              <input
                ref={avatarInputRef}
                id='avatar-upload'
                type='file'
                accept='image/*'
                className='settings-avatar-input'
                onChange={handleAvatarChange}
              />
              <button
                className='settings-avatar-button settings-avatar-button--primary'
                type='button'
                disabled={uploadAvatarLoading || deleteAvatarLoading}
                onClick={() => avatarInputRef.current?.click()}
              >
                <Camera aria-hidden='true' />
                {uploadAvatarLoading ? 'Uploading...' : 'Upload Avatar'}
              </button>
              {(avatarPreview || user?.avatarUrl) && (
                <button
                  className='settings-avatar-button'
                  type='button'
                  disabled={uploadAvatarLoading || deleteAvatarLoading}
                  onClick={handleRemoveAvatar}
                >
                  {deleteAvatarLoading ? 'Removing...' : 'Remove'}
                </button>
              )}
            </div>
          </div>
          {avatarNotice && <p className='settings-inline-note'>{avatarNotice}</p>}

          <div className='settings-profile-fields' aria-label='Account details'>
            <label className='settings-profile-field'>
              <span>Username</span>
              <input type='text' value={user?.username || ''} disabled />
            </label>
            <label className='settings-profile-field'>
              <span>Email</span>
              <input type='email' value={user?.email || ''} disabled />
            </label>
          </div>
        </section>

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
                disabled={isSavingSettings}
                onClick={() => handleThemeChange('light')}
              >
                <Sun aria-hidden='true' />
                <span>Light</span>
              </button>
              <button
                className={`theme-segmented__option${theme === 'dark' ? ' theme-segmented__option--active' : ''}`}
                type='button'
                aria-pressed={theme === 'dark'}
                disabled={isSavingSettings}
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
                  disabled={isSavingSettings}
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
                  disabled={isSavingSettings}
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
                        className={
                          option.value === tableSize ? 'settings-menu__option active' : 'settings-menu__option'
                        }
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
                  disabled={isSavingSettings}
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
              <p>
                {isPro ? 'You have access to all RiverIQ Pro features.' : 'Upgrade to unlock every RiverIQ feature.'}
              </p>
            </div>

            <div className='subscription-panel'>
              <span className={`subscription-badge${isPro ? ' subscription-badge--pro' : ''}`}>
                {isPro ? 'Pro' : 'Free'}
              </span>

              {isPro ? (
                <button
                  className='subscription-action subscription-action--secondary'
                  type='button'
                  disabled={cancelSubscriptionLoading}
                  onClick={handleCancelSubscription}
                >
                  {cancelSubscriptionLoading ? 'Canceling...' : 'Cancel Subscription'}
                </button>
              ) : (
                <Link className='subscription-action subscription-action--primary' to='/subscription/payment'>
                  Go Pro Now
                </Link>
              )}
            </div>
          </div>
          {subscriptionNotice && <p className='settings-inline-note'>{subscriptionNotice}</p>}
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
            disabled={forgotPasswordLoading}
            onClick={handleSendPasswordReset}
          >
            <span>
              <strong>{forgotPasswordLoading ? 'Sending Reset Email...' : 'Reset Password'}</strong>
              <small>Send a password reset email to your account address.</small>
            </span>
            <ChevronRight aria-hidden='true' />
          </button>
          {passwordNotice && <p className='settings-inline-note'>{passwordNotice}</p>}
        </section>

        <div className='settings-save-bar'>
          {settingsNotice && <p className='settings-save-bar__notice'>{settingsNotice}</p>}
          <button
            className='settings-save-button'
            type='button'
            disabled={isSavingSettings || !hasSettingsChanges}
            onClick={handleSaveSettings}
          >
            <Save aria-hidden='true' />
            {isSavingSettings ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <footer className='settings-support'>
        Need help? Contact us at <a href='mailto:support@riveriq.com'>support@riveriq.com</a>
      </footer>
    </section>
  );
};

export default SettingsPage;
