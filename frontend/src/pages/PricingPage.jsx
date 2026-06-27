import React, { useState } from 'react';
import { Check, Database, Headphones, LockKeyhole, Monitor, Pencil, ShieldCheck } from 'lucide-react';
import './PricingPage.css';

const freeFeatures = [
  'Bankroll tracking',
  'Profit over time graph',
  'Manual session entry',
  'Recent sessions',
  'Total profit, hands, sessions, BB/100',
  'Basic graphs & filters (30d / 90d / All)',
];

const proFeatures = [
  'Unlimited sessions & hands',
  'Position breakdowns',
  'Upload hand histories',
  'AI-powered leak detection',
  'Advanced statistics',
  'AI coaching & insights',
  'Advanced filters & search',
  'Goal tracking',
  'Session notes & tags',
  'Export to CSV / Excel',
  'Profit by stake, game, site, day, hour',
  'Cloud sync across devices',
  'Priority support',
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
  const proPrice = isYearly ? '7.99' : '9.99';

  return (
    <main className='pricing-page'>
      <div className='pricing-container'>
        <header className='pricing-page-header'>
          <h1>Choose Your Edge</h1>
          <p>Start free and upgrade anytime. All plans include bankroll tracking and powerful insights to help you win more.</p>

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
            <span className={isYearly ? 'active' : ''}>Pay Yearly <small>(Save 20%)</small></span>
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

            <button className='get-started-button' type='button'>
              Get Started Free
            </button>
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
                <span>per month</span>
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

            <button className='start-trial-button' type='button'>
              Start Pro Trial
            </button>
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
