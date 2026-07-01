import React from 'react';
import { BarChart3, BookOpen, Check, LockKeyhole, Plus, Spade } from 'lucide-react';
import { Link } from 'react-router';
import './FeaturePage.css';
import features from '../assets/feature-grid.jsx';

const resultHighlights = [
  'Bankroll tracking',
  'Win rate',
  'Profit over time',
  'Total hands & sessions',
  'BB/100 graph',
  'Custom date ranges',
];

const analyticsStats = [
  'VPIP',
  'PFR',
  '3Bet%',
  'WTSD%',
  'W$SD%',
  'CBet%',
  'Fold to 3Bet',
  'Aggression Factor',
  'Steal%',
  'Check Raise',
  'BB Won',
  'And more...',
];

const positionBreakdown = [
  { position: 'UTG', hands: '850', winRate: '12.35', profit: '$105.47', positive: true },
  { position: 'MP', hands: '1,250', winRate: '18.76', profit: '$234.55', positive: true },
  { position: 'CO', hands: '1,320', winRate: '28.91', profit: '$381.62', positive: true },
  { position: 'BTN', hands: '1,180', winRate: '36.84', profit: '$434.71', positive: true },
  { position: 'SB', hands: '680', winRate: '-8.23', profit: '-$55.92', positive: false },
  { position: 'BB', hands: '1,140', winRate: '-15.72', profit: '-$179.68', positive: false },
];

const detectedLeaks = [
  { name: 'Calling too often from SB', impact: '-2.48 bb/100', severity: 'high' },
  { name: 'Losing too much at Showdown', impact: '-1.95 bb/100', severity: 'high' },
  { name: '3Bet too small', impact: '-1.21 bb/100', severity: 'medium' },
  { name: 'Overfolding to 3Bets', impact: '-0.89 bb/100', severity: 'medium' },
];

const aiInsights = [
  'Personalized leak detection',
  'Impact analysis (bb/100 lost)',
  'Actionable recommendations',
  'AI coaching & strategy tips',
];

const goalBenefits = ['Custom goals', 'Progress tracking', 'Streaks & achievements', 'Motivation to keep grinding'];

const goals = [
  { icon: Spade, label: 'Play 20,000 hands this month', value: '12,450 / 20,000', progress: '62%' },
  { icon: BarChart3, label: 'Achieve 5 bb/100 Win Rate', value: '3.2 / 5', progress: '64%' },
  { icon: BookOpen, label: 'Study 10 hours this month', value: '6.5 / 10', progress: '65%' },
];

const freeFeatures = [
  'All core tracking features',
  'Manual session entry',
  'Basic stats & graphs',
  'Up to 100 sessions',
];

const proFeatures = [
  'Everything in Free',
  'Unlimited sessions & hands',
  'Upload hand histories',
  'Advanced stats & AI insights',
];

const FeaturePage = () => {
  return (
    <main className='feature-page'>
      <div className='feature-container'>
        <header className='header'>
          <h2>
            All the tools you need to <span className='accent'>track</span>, <span className='accent'>analyze</span>, &{' '}
            <span className='accent'>improve</span>
          </h2>
          <p>Powerful features designed for poker players who want to win more. </p>
        </header>
        <br />
        <br />
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
                <strong>$3,450.75</strong>
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
                    $4K
                  </text>
                  <text x='12' y='92'>
                    $2K
                  </text>
                  <text x='24' y='148'>
                    $0
                  </text>
                  <text x='8' y='204'>
                    -$1K
                  </text>
                  <text x='8' y='260'>
                    -$2K
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

              <span className='chart-value'>$3,450.75</span>
            </div>
          </div>

          <div className='results-copy'>
            <span className='section-kicker'>Track everything</span>
            <h2>See your results clearly</h2>
            <p>Beautiful graphs and easy-to-read stats help you understand your performance over time.</p>

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
            <span className='section-kicker'>Powerful analytics</span>
            <h2>Advanced stats that matter</h2>
            <p>Go beyond the basics with professional-level statistics used by winning players.</p>

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
                      <td className={row.positive ? 'positive' : 'negative'}>{row.profit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className='insights-section'>
          <div className='leak-card'>
            <h3>AI Leak Detection</h3>

            <div className='leak-card-body'>
              <div className='leak-donut' aria-label='7 total leaks detected'>
                <div>
                  <strong>7</strong>
                  <span>Total Leaks</span>
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
            <span className='section-kicker'>AI-powered insights</span>
            <h2>
              Find leaks. Fix leaks. <strong>Win more.</strong>
            </h2>
            <p>Our AI analyzes your hands and spots the biggest leaks in your game with clear, actionable advice.</p>

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
            <span className='section-kicker'>Set goals & level up</span>
            <h2>Stay focused and improve</h2>
            <p>Set goals, track progress, and build better habits one session at a time.</p>

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
            <p>Start for free and upgrade anytime.</p>
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
                  <strong>$19.99</strong>
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
                Start Pro Trial
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
