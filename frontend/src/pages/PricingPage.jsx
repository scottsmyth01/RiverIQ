import React, { useState } from 'react';
import { ArrowLeft, Check, Database, Headphones, LockKeyhole, Monitor, Pencil, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import './PricingPage.css';

const freeFeatures = [
  '20 sessions',
  'Profit over time graph',
  'Manual session entry',
  'Recent sessions',
  'Total profit, hands, sessions, BB/100',
  'Basic graphs & filters',
];

const proFeatures = [
  'Unlimited sessions & hands',
  'Analytics',
  'Reports',
  'Goal Tracking',
  'Hand Charts',
  'AI-powered leak detection',
  'Advanced statistics',
  'Advanced filters & search',
  'Export to CSV / Excel',
];

const trustItems = [
  {
    icon: ShieldCheck,
    title: '14-Day Money Back Guarantee',
    text: 'Not satisfied? Get a full refund.',
  },
  {
    icon: LockKeyhole,
    title: 'Secure & Private',
    text: 'Your data is encrypted and never shared.',
  },
  {
    icon: Headphones,
    title: 'Built for Poker Players',
    text: 'From grinders to pros.',
  },
];

const PricingPage = () => {
  const [isYearly, setIsYearly] = useState(false);
  const { user } = useAuth();
  const proPrice = isYearly ? '149.99' : '14.99';
  const proCadence = isYearly ? 'per year' : 'per month';
  const subscriptionPath = `/subscription/payment${isYearly ? '?billing=yearly' : ''}`;
  const isCurrentFreeTier = user?.subscription === 'free';

  return (
    <main className='pricing-page'>
      <div className='pricing-container'>
        {user && (
          <Link className='pricing-back-dashboard' to='/dashboard'>
            <ArrowLeft aria-hidden='true' />
            Back to Dashboard
          </Link>
        )}

        <header className='pricing-page-header'>
          <h1>Choose Your Edge</h1>
          <p>
            Start free and upgrade anytime. All plans include bankroll tracking and powerful insights to help you win
            more.
          </p>

          <div className='billing-selector'>
            <span className={!isYearly ? 'active' : ''}>Pay Monthly</span>
            <button
              className={`billing-toggle ${isYearly ? 'yearly' : ''}`}
              type='button'
              role='switch'
              aria-checked={isYearly}
              aria-label='Toggle yearly billing'
              onClick={() => setIsYearly((yearly) => !yearly)}
            >
              <span></span>
            </button>
            <span className={isYearly ? 'active' : ''}>
              Pay Yearly <small>(Save $29.89)</small>
            </span>
          </div>
        </header>

        <section className='pricing-cards' aria-label='Pricing plans'>
          <article className='pricing-card free-card'>
            <div className='pricing-card-heading'>
              <div>
                <h2>Free</h2>
                <p>Perfect for getting started.</p>
              </div>
              <div className='pricing-amount'>
                <strong>$0</strong>
                <span>forever</span>
              </div>
            </div>

            <div className='pricing-divider'></div>

            <h3>Includes</h3>
            <ul className='pricing-feature-list'>
              {freeFeatures.map((feature) => (
                <li key={feature}>
                  <Check aria-hidden='true' />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <h3 className='limits-title'>Limits</h3>
            <div className='free-limits'>
              <span>
                <Database aria-hidden='true' /> Up to 100 sessions
              </span>
              <span>
                <Pencil aria-hidden='true' /> Manual entry only
              </span>
              <span>
                <Monitor aria-hidden='true' /> 1 device
              </span>
            </div>

            <Link className='get-started-button' to='/register'>
              {isCurrentFreeTier ? 'Current tier' : 'Get Started Free'}
            </Link>
          </article>

          <article className='pricing-card pro-card'>
            <span className='most-popular'>Most Popular</span>

            <div className='pricing-card-heading'>
              <div>
                <h2>Pro</h2>
                <p>Everything you need to crush your game.</p>
              </div>
              <div className='pricing-amount'>
                <strong>${proPrice}</strong>
                <span>{proCadence}</span>
              </div>
            </div>

            <div className='pricing-divider'></div>

            <h3>Everything in Free, plus:</h3>
            <ul className='pricing-feature-list pro-feature-list'>
              {proFeatures.map((feature) => (
                <li key={feature}>
                  <Check aria-hidden='true' />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link className='start-trial-button' to={user ? subscriptionPath : '/login'}>
              Start Pro Subscription
            </Link>
            <p className='pricing-cancel-note'>
              <LockKeyhole aria-hidden='true' />
              Cancel anytime. No risk.
            </p>
          </article>
        </section>

        <section className='pricing-trust-bar' aria-label='Purchase benefits'>
          {trustItems.map(({ icon: TrustIcon, title, text }) => (
            <div className='trust-item' key={title}>
              <TrustIcon aria-hidden='true' />
              <div>
                <strong>{title}</strong>
                <span>{text}</span>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
};

export default PricingPage;
