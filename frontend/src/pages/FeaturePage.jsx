import React from 'react';
import { BarChart3, Check, FileText, LockKeyhole, Plus, Spade } from 'lucide-react';
import { Link } from 'react-router';
import './FeaturePage.css';
import features from '../assets/feature-grid.jsx';
import { useAuth } from '../hooks/useAuth';
import { convertFromUsd, formatCurrency, getCurrencySymbol, getPreferredCurrency } from '../utils/currency';

const resultHighlights = [
  'Profit tracking',
  'Hands played',
  'Session history',
  'BB/100 graph',
  'Recent sessions table',
  'Saved date filters',
];

const analyticsStats = [
  'VPIP',
  'PFR',
  '3Bet%',
  '4Bet%',
  'F3Bet%',
  'F4Bet%',
  'WTSD%',
  'W$SD%',
  'CBet%',
  'FCBet%',
  'TBet%',
  'FTBet%',
  'AF',
  'Steal%',
  'FSteal%',
];

const positionBreakdown = [
  { position: 'UTG', hands: '850', winRate: '12.35', profit: 105.47, positive: true },
  { position: 'MP', hands: '1,250', winRate: '18.76', profit: 234.55, positive: true },
  { position: 'CO', hands: '1,320', winRate: '28.91', profit: 381.62, positive: true },
  { position: 'BTN', hands: '1,180', winRate: '36.84', profit: 434.71, positive: true },
  { position: 'SB', hands: '680', winRate: '-8.23', profit: -55.92, positive: false },
  { position: 'BB', hands: '1,140', winRate: '-15.72', profit: -179.68, positive: false },
];

const detectedLeaks = [
  { name: 'F3Bet below target', impact: '41.2%', severity: 'high' },
  { name: 'Aggression above goal', impact: '2.6 AF', severity: 'medium' },
  { name: 'CBet outside range', impact: '63.5%', severity: 'medium' },
  { name: 'F4Bet needs sample', impact: 'Review', severity: 'medium' },
];

const aiInsights = [
  'Preflop and postflop stat goals',
  'Leak cards only when data exists',
  'Position and table-size filters',
  'Clear target ranges for each metric',
];

const goalBenefits = ['Create goals', 'Edit or delete goals', 'Filter by status', 'Track progress toward targets'];

const goals = [
  { icon: Spade, label: 'Play 20,000 hands this month', value: '12,450 / 20,000', progress: '62%' },
  { icon: BarChart3, label: 'Achieve 5 bb/100 Win Rate', value: '3.2 / 5', progress: '64%' },
  { icon: FileText, label: 'Review 12 tagged sessions', value: '7 / 12', progress: '58%' },
];

const freeFeatures = [
  'Create an account',
  'Upload and review sessions',
  'Dashboard stats',
  'Settings and preferences',
];

const proFeatures = [
  'Everything in Free',
  'Analytics, reports, goals, and hand charts',
  'Saved reports',
  'Full hand-history workflow',
];

function formatCompactCurrency(value, currency) {
  const convertedValue = convertFromUsd(value, currency);

  if (!Number.isFinite(convertedValue)) return 'N/A';

  const sign = convertedValue < 0 ? '-' : '';
  const absValue = Math.abs(convertedValue);
  const symbol = getCurrencySymbol(currency);

  if (absValue >= 1000) {
    return `${sign}${symbol}${Math.round(absValue / 1000).toLocaleString('en-US')}K`;
  }

  return `${sign}${symbol}${Math.round(absValue).toLocaleString('en-US')}`;
}

const FeaturePage = () => {
  const { user } = useAuth();
  const currency = getPreferredCurrency(user);

  return (
    <main className='feature-page'>
      <div className='feature-container'>
        <header className='header'>
          <h2>
            Track sessions, analyze leaks, and build better <span className='accent'>poker habits</span>
          </h2>
          <p>RiverIQ turns uploaded hand histories into dashboards, reports, goals, and hand charts you can use every session.</p>
        </header>

        <section className='feature-grid'>
          {features.map((feature) => (
            <article className='feature-item' key={feature.title}>
              <div className='feature-icon'>{feature.icon}</div>
              <div>
                <h3>{feature.title}</h3>
                <p className='feature-text'>{feature.text}</p>
              </div>
            </article>
          ))}
        </section>

        <section className='results-section'>
          <div className='profit-card'>
            <div className='profit-card-header'>
              <div>
                <span className='profit-label'>Total Profit</span>
                <strong>{formatCurrency(3450.75, currency)}</strong>
              </div>
              <button type='button' className='time-filter'>
                All Time <span aria-hidden='true'>⌄</span>
              </button>
            </div>

            <div className='profit-chart'>
              <svg viewBox='0 0 620 280' role='img' aria-label='Profit increasing from March 2024 to January 2025'>
                <defs>
                  <linearGradient id='profit-fill' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='0%' stopColor='#00c853' stopOpacity='0.32' />
                    <stop offset='100%' stopColor='#00c853' stopOpacity='0' />
                  </linearGradient>
                </defs>

                <g className='chart-grid'>
                  <line x1='55' y1='32' x2='600' y2='32' />
                  <line x1='55' y1='88' x2='600' y2='88' />
                  <line x1='55' y1='144' x2='600' y2='144' />
                  <line x1='55' y1='200' x2='600' y2='200' />
                  <line x1='55' y1='256' x2='600' y2='256' />
                  <line x1='130' y1='20' x2='130' y2='256' />
                  <line x1='225' y1='20' x2='225' y2='256' />
                  <line x1='320' y1='20' x2='320' y2='256' />
                  <line x1='415' y1='20' x2='415' y2='256' />
                  <line x1='510' y1='20' x2='510' y2='256' />
                </g>

                <path
                  className='chart-area'
                  d='M145 213 L160 207 L175 220 L190 199 L205 195 L220 185 L235 181 L250 169 L265 174 L280 158 L295 151 L310 163 L325 146 L340 140 L355 130 L370 133 L385 116 L400 106 L415 108 L430 96 L445 91 L460 82 L475 86 L490 72 L505 69 L520 61 L535 66 L550 57 L565 55 L580 51 L580 256 L145 256 Z'
                />
                <polyline className='loss-line' points='55,196 70,188 85,207 100,199 115,216 130,201 145,213' />
                <polyline
                  className='profit-line'
                  points='145,213 160,207 175,220 190,199 205,195 220,185 235,181 250,169 265,174 280,158 295,151 310,163 325,146 340,140 355,130 370,133 385,116 400,106 415,108 430,96 445,91 460,82 475,86 490,72 505,69 520,61 535,66 550,57 565,55 580,51'
                />
                <circle className='chart-marker' cx='580' cy='51' r='5' />

                <g className='axis-labels'>
                  <text x='12' y='36'>
                    {formatCompactCurrency(4000, currency)}
                  </text>
                  <text x='12' y='92'>
                    {formatCompactCurrency(2000, currency)}
                  </text>
                  <text x='24' y='148'>
                    {formatCompactCurrency(0, currency)}
                  </text>
                  <text x='8' y='204'>
                    {formatCompactCurrency(-1000, currency)}
                  </text>
                  <text x='8' y='260'>
                    {formatCompactCurrency(-2000, currency)}
                  </text>
                  <text x='55' y='276'>
                    Jan '24
                  </text>
                  <text x='165' y='276'>
                    Mar '24
                  </text>
                  <text x='275' y='276'>
                    May '24
                  </text>
                  <text x='385' y='276'>
                    Sep '24
                  </text>
                  <text x='540' y='276'>
                    Jan '25
                  </text>
                </g>
              </svg>

              <span className='chart-value'>{formatCurrency(3450.75, currency)}</span>
            </div>
          </div>

          <div className='results-copy'>
            <span className='section-kicker'>Dashboard</span>
            <h2>See your results clearly</h2>
            <p>Track profit, hands, sessions, and BB/100 with quick filters for the time ranges you actually review.</p>

            <ul className='results-list'>
              {resultHighlights.map((highlight) => (
                <li key={highlight}>
                  <Check aria-hidden='true' />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className='analytics-section'>
          <div className='analytics-copy'>
            <span className='section-kicker'>Analytics</span>
            <h2>Review the stats you already track</h2>
            <p>Compare preflop and postflop metrics by position, table size, and date range.</p>

            <div className='stat-pills'>
              {analyticsStats.map((stat) => (
                <span key={stat}>{stat}</span>
              ))}
            </div>
          </div>

          <div className='position-card'>
            <h3>Position Breakdown</h3>
            <div className='position-table-wrapper'>
              <table className='position-table'>
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Hands</th>
                    <th>Win Rate (bb/100)</th>
                    <th>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {positionBreakdown.map((row) => (
                    <tr key={row.position}>
                      <td>{row.position}</td>
                      <td>{row.hands}</td>
                      <td className={row.positive ? 'positive' : 'negative'}>{row.winRate}</td>
                      <td className={row.positive ? 'positive' : 'negative'}>{formatCurrency(row.profit, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className='insights-section'>
          <div className='leak-card'>
            <h3>Leak Tracker</h3>

            <div className='leak-card-body'>
              <div className='leak-donut' aria-label='4 stats outside goal range'>
                <div>
                  <strong>4</strong>
                  <span>To Review</span>
                </div>
              </div>

              <div className='leak-details'>
                <div className='leak-headings'>
                  <span>Leak</span>
                  <span>Impact</span>
                </div>

                <ul className='leak-list'>
                  {detectedLeaks.map((leak) => (
                    <li key={leak.name}>
                      <span>{leak.name}</span>
                      <strong className={leak.severity}>{leak.impact}</strong>
                    </li>
                  ))}
                </ul>

                <button className='view-leaks-button' type='button'>
                  View all leaks <span aria-hidden='true'>→</span>
                </button>
              </div>
            </div>
          </div>

          <div className='insights-copy'>
            <span className='section-kicker'>Leak tracker</span>
            <h2>
              Spot stats that drift from your goals.
            </h2>
            <p>RiverIQ highlights out-of-range stats when there are enough hands to make the signal useful.</p>

            <ul className='insights-list'>
              {aiInsights.map((insight) => (
                <li key={insight}>
                  <Check aria-hidden='true' />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className='goals-section'>
          <div className='goals-copy'>
            <span className='section-kicker'>Goals</span>
            <h2>Keep your poker targets visible</h2>
            <p>Create goals, track progress, and organize what you are working on between sessions.</p>

            <ul className='goal-benefits'>
              {goalBenefits.map((benefit) => (
                <li key={benefit}>
                  <Check aria-hidden='true' />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className='goals-card'>
            <div className='goals-card-header'>
              <h3>Goals</h3>
              <button type='button'>
                <Plus aria-hidden='true' />
                New Goal
              </button>
            </div>

            <div className='goal-rows'>
              {goals.map(({ icon: GoalIcon, label, value, progress }) => (
                <div className='goal-row' key={label}>
                  <div className='goal-icon'>
                    <GoalIcon aria-hidden='true' />
                  </div>
                  <div className='goal-content'>
                    <div className='goal-meta'>
                      <strong>{label}</strong>
                      <span>{value}</span>
                    </div>
                    <div className='goal-track'>
                      <span style={{ width: progress }}></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className='pricing-cta'>
          <div className='pricing-heading'>
            <h2>Ready to take your game to the next level?</h2>
            <p>Start tracking sessions, then unlock deeper analysis when you are ready.</p>
          </div>

          <div className='pricing-plans'>
            <article className='plan-card'>
              <div className='plan-header'>
                <h3>Free</h3>
                <div className='plan-price'>
                  <strong>$0</strong>
                  <span>forever</span>
                </div>
              </div>

              <ul className='plan-features'>
                {freeFeatures.map((feature) => (
                  <li key={feature}>
                    <Check aria-hidden='true' />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link className='free-plan-button' to='/register'>
                Start Free
              </Link>
            </article>

            <article className='plan-card pro-plan'>
              <div className='plan-header'>
                <h3>Pro</h3>
                <div className='plan-price'>
                  <span className='popular-badge'>Most Popular</span>
                  <strong>$14.99</strong>
                  <span>per month</span>
                </div>
              </div>

              <ul className='plan-features'>
                {proFeatures.map((feature) => (
                  <li key={feature}>
                    <Check aria-hidden='true' />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link className='pro-plan-button' to='/subscription/payment'>
                Start Pro Subscription
              </Link>
              <p className='cancel-note'>
                <LockKeyhole aria-hidden='true' />
                Cancel anytime. No risk.
              </p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
};

export default FeaturePage;
