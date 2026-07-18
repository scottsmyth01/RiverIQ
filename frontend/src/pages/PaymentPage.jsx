import './PaymentPage.css';

import {
  ArrowLeft,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  CreditCard,
  Crown,
  Gift,
  Lock,
  LogOut,
  Settings,
  ShieldCheck,
  Sparkle,
  Star,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import logo from '../components/Navbar_dashboard/logo.png';
import { useAuth } from '../hooks/useAuth';

const includedFeatures = [
  'Unlimited sessions',
  'Advanced analytics & reports',
  'Hand history upload & parsing',
  'Preflop charts & ranges',
  'Export data (CSV)',
  'Priority support',
];

const trialSteps = ['Account', 'Payment', 'Confirm'];

const planPrices = {
  CAD: {
    monthly: '$29.99 CAD',
  },
  USD: {
    monthly: '$19.99 USD',
  },
};

function getDisplayName(user) {
  return user?.username || user?.fullName || user?.name || 'Scott Smyth';
}

function getEmail(user) {
  return user?.email || 'scott.smyth@email.com';
}

function getInitials(name) {
  return name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const PaymentPage = () => {
  const { user, logout } = useAuth();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const displayName = getDisplayName(user);
  const email = getEmail(user);
  const initials = getInitials(displayName);
  const preferredCurrency = user?.preferences?.currency || 'USD';
  const planPrice = planPrices[preferredCurrency] || planPrices.USD;

  function handleSubmit(event) {
    event.preventDefault();
  }

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
    <main className='payment-page'>
      <header className='payment-topbar'>
        <Link className='payment-brand' to='/dashboard' aria-label='RiverIQ dashboard'>
          <img src={logo} alt='' />
          <span>
            River<strong>IQ</strong>
          </span>
        </Link>

        <div className='payment-account' ref={accountMenuRef}>
          <button type='button' aria-label='Notifications'>
            <Bell aria-hidden='true' />
          </button>

          <button
            className='payment-account-trigger'
            type='button'
            aria-expanded={isAccountOpen}
            aria-haspopup='menu'
            onClick={() => setIsAccountOpen((isOpen) => !isOpen)}
          >
            <span className='payment-avatar'>{initials}</span>
            <span>{displayName}</span>
            <ChevronDown className={isAccountOpen ? 'open' : ''} aria-hidden='true' />
          </button>

          {isAccountOpen && (
            <div className='payment-account-menu' role='menu'>
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
      </header>

      <div className='payment-shell'>
        <section className='payment-main-panel'>
          <Link className='payment-back-link' to='/pricing'>
            <ArrowLeft aria-hidden='true' />
            Back to Subscription
          </Link>

          <header className='payment-hero'>
            <h1>Start Your Pro Trial</h1>
            <p>You&apos;re just seconds away from unlocking powerful tools to analyze your game and take your poker to the next level.</p>
          </header>

          <div className='payment-progress' aria-label='Checkout progress'>
            {trialSteps.map((step, index) => (
              <div className={`payment-progress-step${index === 0 ? ' active' : ''}`} key={step}>
                <span>{index + 1}</span>
                <small>{step}</small>
              </div>
            ))}
          </div>

          <div className='payment-trial-banner'>
            <Gift aria-hidden='true' />
            <span>7-day free trial • Cancel anytime • No charges until Jul 2, 2024</span>
          </div>

          <form className='payment-form' autoComplete='off' onSubmit={handleSubmit}>
            <section className='payment-form-card'>
              <h2>1. Account Information</h2>
              <p>You&apos;ll be using this account for your Pro plan.</p>

              <div className='payment-field-grid'>
                <label>
                  <span>Full Name</span>
                  <input autoComplete='off' />
                </label>
                <label>
                  <span>Email</span>
                  <input autoComplete='off' type='email' />
                </label>
              </div>
            </section>

            <section className='payment-form-card'>
              <h2>2. Payment Information</h2>
              <p className='payment-lock-note'>
                <Lock aria-hidden='true' />
                Your card won&apos;t be charged until your trial ends.
              </p>

              <label className='payment-field-full'>
                <span>Card Number</span>
                <div className='payment-card-input'>
                  <CreditCard aria-hidden='true' />
                  <input autoComplete='off' defaultValue='4242 4242 4242 4242' inputMode='numeric' />
                  <div className='payment-card-brands' aria-hidden='true'>
                    <i>VISA</i>
                    <i>MC</i>
                    <i>AMEX</i>
                    <i>DISC</i>
                  </div>
                </div>
              </label>

              <div className='payment-field-grid'>
                <label>
                  <span>Expiry Date</span>
                  <input autoComplete='off' defaultValue='12 / 34' placeholder='MM / YY' />
                </label>
                <label>
                  <span>CVC</span>
                  <div className='payment-cvc-input'>
                    <input autoComplete='off' defaultValue='123' inputMode='numeric' />
                    <CircleHelp aria-hidden='true' />
                  </div>
                </label>
              </div>

              <label className='payment-field-full'>
                <span>Zip / Postal Code</span>
                <input autoComplete='off' defaultValue='90210' />
              </label>

              <button className='payment-submit' type='submit'>
                <Lock aria-hidden='true' />
                Start 7-Day Free Trial
              </button>

              <p className='payment-after-note'>
                After your trial ends, you&apos;ll be charged {planPrice.monthly} per month.
                <br />
                You can cancel anytime from your account settings.
              </p>
            </section>
          </form>

          <p className='payment-terms'>
            By starting your free trial, you agree to our <Link to='/about'>Terms of Service</Link> and <Link to='/about'>Privacy Policy</Link>.
          </p>
        </section>

        <aside className='payment-sidebar'>
          <section className='payment-summary-card'>
            <h2>Order Summary</h2>
            <div className='payment-plan-icon'>
              <Crown aria-hidden='true' />
            </div>
            <strong>Pro Plan</strong>
            <span>7-Day Free Trial</span>

            <div className='payment-price-lines'>
              <p>
                <span>Trial Today</span>
                <strong>$0.00</strong>
              </p>
              <p>
                <span>After Jul 2, 2024</span>
                <em>{planPrice.monthly} / month</em>
              </p>
            </div>

            <ul className='payment-feature-list'>
              {includedFeatures.map((feature) => (
                <li key={feature}>
                  <Check aria-hidden='true' />
                  {feature}
                </li>
              ))}
            </ul>
          </section>

          <section className='payment-side-card'>
            <h2>
              <Lock aria-hidden='true' />
              Secure Checkout
            </h2>
            <p>
              <Sparkle aria-hidden='true' />
              Your payment information is encrypted and secure.
            </p>
            <div className='payment-security-row'>
              <span className='payment-stripe'>stripe</span>
              <span>
                <ShieldCheck aria-hidden='true' />
                256-bit SSL
              </span>
            </div>
          </section>

          <section className='payment-side-card'>
            <h2>Love RiverIQ?</h2>
            <blockquote>
              “This tool has completely transformed the way I review my game.”
            </blockquote>
            <p>— Verified User</p>
            <div className='payment-stars' aria-label='Five star rating'>
              {Array.from({ length: 5 }).map((_, index) => (
                <Star aria-hidden='true' fill='currentColor' key={index} />
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
};

export default PaymentPage;
