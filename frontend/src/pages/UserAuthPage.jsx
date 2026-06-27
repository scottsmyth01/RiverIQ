import React, { useState } from 'react';
import { BarChart3, Clock, CloudUpload, Eye, Lock, Mail, ShieldCheck, Spade } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './UserAuthPage.css';
import { useAuth } from '../context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';

const UserAuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState(location.pathname === '/register' ? 'register' : 'login');

  const { register, login } = useAuth();

  const changeAuthMode = (mode) => {
    setAuthMode(mode);
    setFieldErrors({});
    navigate(mode === 'register' ? '/register' : '/login');
  };

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));

    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [name]: '',
      form: '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const { username, email, password, passwordConfirm } = formData;

    if (authMode === 'register') {
      try {
        await register({ username, email, password, passwordConfirm });
        toast.success('Registration Successful');
      } catch (error) {
        const field = error.field && Object.hasOwn(formData, error.field) ? error.field : 'form';
        setFieldErrors({ [field]: error.message });
      }
    }

    if (authMode === 'login') {
      try {
        await login({ email, password });
        toast.success('Login Successful');
      } catch (error) {
        const field = error.field && Object.hasOwn(formData, error.field) ? error.field : 'form';
        setFieldErrors({ [field]: error.message });
      }
    }
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

          <form className='auth-form' onSubmit={handleSubmit}>
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
              <label className={`auth-field ${fieldErrors.username ? 'has-error' : ''}`}>
                <span>Username</span>
                <div>
                  <Spade aria-hidden='true' />
                  <input
                    type='text'
                    name='username'
                    placeholder='Choose a username'
                    onChange={handleChange}
                    autoComplete='username'
                    autoCapitalize='none'
                    spellCheck='false'
                  />
                </div>
                {fieldErrors.username && (
                  <small className='auth-field-error' role='alert'>
                    {fieldErrors.username}
                  </small>
                )}
              </label>
            )}

            <label className={`auth-field ${fieldErrors.email ? 'has-error' : ''}`}>
              <span>Email</span>
              <div>
                <Mail aria-hidden='true' />
                <input
                  type='email'
                  name='email'
                  placeholder='Enter your email'
                  onChange={handleChange}
                  autoComplete='email'
                />
              </div>
              {fieldErrors.email && (
                <small className='auth-field-error' role='alert'>
                  {fieldErrors.email}
                </small>
              )}
            </label>

            {authMode !== 'forgot' && (
              <label className={`auth-field ${fieldErrors.password ? 'has-error' : ''}`}>
                <span>Password</span>
                <div>
                  <Lock aria-hidden='true' />
                  <input
                    type='password'
                    placeholder='Enter your password'
                    name='password'
                    onChange={handleChange}
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button className='password-toggle' type='button' aria-label='Show password'>
                    <Eye aria-hidden='true' />
                  </button>
                </div>
                {fieldErrors.password && (
                  <small className='auth-field-error' role='alert'>
                    {fieldErrors.password}
                  </small>
                )}
              </label>
            )}

            {authMode === 'register' && (
              <label className={`auth-field ${fieldErrors.passwordConfirm ? 'has-error' : ''}`}>
                <span>Confirm Password</span>
                <div>
                  <Lock aria-hidden='true' />
                  <input
                    type='password'
                    name='passwordConfirm'
                    placeholder='Confirm your password'
                    onChange={handleChange}
                    autoComplete='new-password'
                  />
                </div>
                {fieldErrors.passwordConfirm && (
                  <small className='auth-field-error' role='alert'>
                    {fieldErrors.passwordConfirm}
                  </small>
                )}
              </label>
            )}

            {fieldErrors.form && (
              <p className='auth-field-error auth-form-error' role='alert'>
                {fieldErrors.form}
              </p>
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

            <button className='auth-submit' type='submit'>
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
      <ToastContainer />
    </main>
  );
};

export default UserAuthPage;
