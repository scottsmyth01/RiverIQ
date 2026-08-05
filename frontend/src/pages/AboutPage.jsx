import React from 'react';
import { BarChart3, Brain, Globe2, LockKeyhole, Spade, Target, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, getPreferredCurrency } from '../utils/currency';
import './AboutPage.css';

const beliefs = [
  {
    icon: Target,
    title: 'Data Over Ego',
    text: 'Numbers don’t lie. We help you see the truth so you can focus on improving.',
  },
  {
    icon: BarChart3,
    title: 'Progress, Not Perfection',
    text: 'Small improvements, compounded over time, create winning players.',
  },
  {
    icon: Brain,
    title: 'Learn. Adapt. Win.',
    text: 'The best players keep learning. We give you the insights to stay ahead.',
  },
  {
    icon: LockKeyhole,
    title: 'Privacy First',
    text: 'Your data is yours. We keep it secure, private, and never sell your information.',
  },
];

const missionStats = [
  { icon: Users, value: '10K+', label: 'Players Trust RiverIQ' },
  { icon: Globe2, value: '120+', label: 'Countries' },
  { icon: TrendingUp, value: 'Millions', label: 'Hands Analyzed' },
];

const AboutPage = () => {
  const { user } = useAuth();
  const currency = getPreferredCurrency(user);

  return (
    <main className='about-page'>
      <div className='about-container'>
        <section className='about-hero'>
          <div className='about-hero-copy'>
            <h1>
              About <span>RiverIQ</span>
            </h1>
            <h2>Poker. Data. Edge.</h2>
            <p>
              RiverIQ was built by poker players, for poker players. We know grind is hard. It’s easy to play thousands
              of hands but tough to know what’s actually working.
            </p>
            <p>
              That’s why we created RiverIQ—to help you track every session, analyze your game, find leaks, and make
              better decisions so you can win more.
            </p>
            <Link className='about-primary-button' to='/register'>
              Start Your Edge Today
            </Link>
          </div>

          <div className='about-dashboard'>
            <div className='about-dashboard-topbar'>
              <span className='about-dashboard-brand'>
                <Spade aria-hidden='true' /> RiverIQ
              </span>
              <span className='about-dashboard-user'>Scott Smyth⌄</span>
            </div>

            <div className='about-dashboard-layout'>
              <div className='about-dashboard-sidebar'>
                {['Dashboard', 'Sessions', 'Analytics', 'Reports', 'Goals', 'Settings'].map((item, index) => (
                  <span className={index === 0 ? 'selected' : ''} key={item}>
                    {item}
                  </span>
                ))}
              </div>

              <div className='dashboard-main'>
                <div className='dashboard-profit'>
                  <span>Total Profit</span>
                  <strong>{formatCurrency(3450.75, currency)}</strong>
                </div>
                <img src='/hero.png' alt='RiverIQ profit chart trending upward' />
                <div className='about-dashboard-stats'>
                  <span>
                    BB/100 <strong>12.35</strong>
                  </span>
                  <span>
                    Hands <strong>27,950</strong>
                  </span>
                  <span>
                    Win Rate <strong>8.4 bb/100</strong>
                  </span>
                  <span>
                    Sessions <strong>142</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className='beliefs-section'>
          <h2>What We Believe</h2>
          <div className='belief-grid'>
            {beliefs.map(({ icon: BeliefIcon, title, text }) => (
              <article key={title}>
                <BeliefIcon aria-hidden='true' />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className='story-section'>
          <div className='story-visual' aria-hidden='true'>
            <div className='story-glow'></div>
            <div className='poker-chip chip-one'></div>
            <div className='poker-chip chip-two'></div>
            <div className='poker-chip chip-three'></div>
            <div className='story-laptop'>
              <div className='laptop-screen'>
                <img src='/hero.png' alt='' />
                <div className='screen-stats'>
                  <span>Profit</span>
                  <strong>{formatCurrency(3450.75, currency)}</strong>
                </div>
              </div>
              <div className='laptop-base'></div>
            </div>
            <img className='story-logo' src='/logo.png' alt='' />
          </div>

          <div className='story-copy'>
            <span className='about-kicker'>Our story</span>
            <h2>From the tables to your game</h2>
            <p>
              RiverIQ started as a simple spreadsheet. We were frustrated with not knowing our true win rate, where our
              leaks were, or how we compared to tougher players.
            </p>
            <p>
              We couldn’t find a tool that was easy to use, actually helpful, and made for real players—not just pros.
              So we built RiverIQ.
            </p>
            <p>Today, we’re proud to help thousands of players around the world turn data into an edge.</p>
          </div>
        </section>

        <section className='mission-section'>
          <div className='mission-copy'>
            <h2>Our Mission</h2>
            <p>
              To give every poker player the tools and insights they need to play smarter, improve faster, and achieve
              their goals.
            </p>
          </div>

          <div className='mission-stats'>
            {missionStats.map(({ icon: StatIcon, value, label }) => (
              <div key={label}>
                <StatIcon aria-hidden='true' />
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className='about-cta'>
          <img src='/logo.png' alt='' />
          <div>
            <h2>Ready to take control of your game?</h2>
            <p>Join thousands of players who use RiverIQ to track, analyze, and win more.</p>
          </div>
          <div className='about-cta-action'>
            <Link to='/register'>Start Free</Link>
            <span>No credit card required.</span>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AboutPage;
