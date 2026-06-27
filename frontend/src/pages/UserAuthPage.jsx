import React, { useState } from 'react';
import { BarChart3, CloudUpload, Eye, Lock, Mail, ShieldCheck, Spade } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './UserAuthPage.css';

const UserAuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState(location.pathname === '/register' ? 'register' : 'login');

  const changeAuthMode = (mode) => {
    setAuthMode(mode);
    navigate(mode === 'register' ? '/register' : '/login');
  };

  return (
    <main className='user-auth-page'>
      <div className='user-auth-layout'>
        <section className='auth-showcase'>
          <Link className='auth-brand' to='/'>
            <img src='/logo.png' alt='' />
            <span>
              River<span>IQ</span>
            </span>
          </Link>

          <div className='auth-showcase-copy'>
            <h1>
              Track your game.
              <br />
              Improve your <span>edge.</span>
            </h1>
            <p>
              RiverIQ helps poker players track sessions, analyze performance, and make smarter decisions at the tables.
            </p>
          </div>

          <div className='auth-dashboard-preview' aria-hidden='true'>
            <div className='auth-preview-sidebar'>
              <span className='preview-brand'>
                <Spade /> RiverIQ
              </span>
              {['Dashboard', 'Sessions', 'Analytics', 'Reports', 'Goals', 'Hand History', 'Settings'].map(
                (item, index) => (
                  <span className={index === 0 ? 'active' : ''} key={item}>
                    {item}
                  </span>
                ),
              )}
            </div>

            <div className='auth-preview-main'>
              <div className='preview-profit'>
                <span>Total Profit</span>
                <strong>+$4,562.75</strong>
                <small>↑ 12.4 BB/100</small>
              </div>
              <img src='/hero.png' alt='' />
              <div className='preview-sessions'>
                <strong>Recent Sessions</strong>
                <span>
                  May 24, 2024 <b>$186.75</b>
                </span>
                <span>
                  May 23, 2024 <b className='loss'>-$72.30</b>
                </span>
                <span>
                  May 22, 2024 <b>$215.40</b>
                </span>
              </div>
            </div>

            <div className='preview-donut'>
              <div>
                <strong>64</strong>
                <span>Total</span>
              </div>
            </div>
          </div>

          <div className='auth-benefits'>
            <div>
              <ShieldCheck aria-hidden='true' />
              <span>
                <strong>Secure &amp; Private</strong>
                Your data is encrypted
              </span>
            </div>
            <div>
              <BarChart3 aria-hidden='true' />
              <span>
                <strong>Powerful Analytics</strong>
                Insights that matter
              </span>
            </div>
            <div>
              <CloudUpload aria-hidden='true' />
              <span>
                <strong>Upload &amp; Track</strong>
                Import hand histories
              </span>
            </div>
          </div>
        </section>

        <section className='auth-panel'>
          <div className='auth-tabs' role='tablist' aria-label='Authentication options'>
            <button
              className={authMode === 'login' ? 'active' : ''}
              type='button'
              role='tab'
              aria-selected={authMode === 'login'}
              onClick={() => changeAuthMode('login')}
            >
              Log In
            </button>
            <button
              className={authMode === 'register' ? 'active' : ''}
              type='button'
              role='tab'
              aria-selected={authMode === 'register'}
              onClick={() => changeAuthMode('register')}
            >
              Create Account
            </button>
          </div>

          <form className='auth-form'>
            <div className='auth-form-heading'>
              <h2>
                {authMode === 'login'
                  ? 'Welcome back'
                  : authMode === 'register'
                    ? 'Create your account'
                    : 'Reset your password'}
              </h2>
              <p>
                {authMode === 'login'
                  ? 'Log in to your RiverIQ account'
                  : authMode === 'register'
                    ? 'Start tracking your game and improving your edge'
                    : 'Enter your email and we’ll send you a password reset link'}
              </p>
            </div>

            {authMode === 'register' && (
              <label className='auth-field'>
                <span>Username</span>
                <div>
                  <Spade aria-hidden='true' />
                  <input type='text' placeholder='Choose a username' autoComplete='username' />
                </div>
              </label>
            )}

            <label className='auth-field'>
              <span>Email</span>
              <div>
                <Mail aria-hidden='true' />
                <input type='email' placeholder='Enter your email' autoComplete='email' />
              </div>
            </label>

            {authMode !== 'forgot' && (
              <label className='auth-field'>
                <span>Password</span>
                <div>
                  <Lock aria-hidden='true' />
                  <input
                    type='password'
                    placeholder='Enter your password'
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button className='password-toggle' type='button' aria-label='Show password'>
                    <Eye aria-hidden='true' />
                  </button>
                </div>
              </label>
            )}

            {authMode === 'register' && (
              <label className='auth-field'>
                <span>Confirm Password</span>
                <div>
                  <Lock aria-hidden='true' />
                  <input type='password' placeholder='Confirm your password' autoComplete='new-password' />
                </div>
              </label>
            )}

            {authMode === 'login' && (
              <div className='auth-options'>
                <label>
                  <input type='checkbox' defaultChecked />
                  <span>Remember me</span>
                </label>
                <button type='button' onClick={() => setAuthMode('forgot')}>
                  Forgot password?
                </button>
              </div>
            )}

            <button className='auth-submit' type='button'>
              {authMode === 'login' ? 'Log In' : authMode === 'register' ? 'Create Account' : 'Send Reset Link'}
            </button>

            {authMode !== 'forgot' && (
              <>
                <div className='auth-divider'>
                  <span>or</span>
                </div>

                <button className='social-auth-button' type='button'>
                  <span className='google-mark'>G</span>
                  Continue with Google
                </button>
                <button className='social-auth-button' type='button'>
                  <svg className='apple-mark' viewBox='0 0 24 24' aria-hidden='true'>
                    <path
                      fill='currentColor'
                      d='M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2.01.77-3.28.82-1.31.05-2.3-1.32-3.14-2.53C3.44 15.53 2.8 9.3 4.47 6.39c.83-1.44 2.3-2.35 3.9-2.38 1.29-.03 2.5.87 3.29.87.78 0 2.26-1.08 3.81-.92.65.03 2.47.26 3.64 1.97-.09.06-2.17 1.28-2.15 3.82.03 3.04 2.66 4.05 2.69 4.06-.02.07-.42 1.44-1.39 2.91M13 3.5C13.73 2.67 14.94 2.04 16 2c.14 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.17-1.15.41-2.35.99-3.11z'
                    />
                  </svg>
                  Continue with Apple
                </button>
              </>
            )}

            <p className='auth-mode-prompt'>
              {authMode === 'login'
                ? 'Don’t have an account?'
                : authMode === 'register'
                  ? 'Already have an account?'
                  : 'Remember your password?'}
              <button type='button' onClick={() => changeAuthMode(authMode === 'login' ? 'register' : 'login')}>
                {authMode === 'login' ? 'Create one' : 'Log in'}
              </button>
            </p>
          </form>
        </section>
      </div>

      <footer className='auth-footer'>
        <span>© 2026 RiverIQ. All rights reserved.</span>
        <nav>
          <a href='#terms'>Terms of Service</a>
          <a href='#privacy'>Privacy Policy</a>
          <a href='#contact'>Contact Us</a>
        </nav>
      </footer>
    </main>
  );
};

export default UserAuthPage;
