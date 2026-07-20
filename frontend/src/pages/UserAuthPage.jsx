import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Clock,
  CloudUpload,
  Eye,
  LoaderCircle,
  Lock,
  Mail,
  MailCheck,
  ShieldCheck,
  Spade,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import './UserAuthPage.css';
import { useAuth } from '../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import LoadingScreen from '../components/LoadingScreen/LoadingScreen';

const UserAuthPage = () => {
  const modeByPath = {
    '/login': 'login',
    '/register': 'register',
    '/forgot-password': 'forgot',
  };
  const location = useLocation();
  const navigate = useNavigate();
  const [resetLinkSent, setResetLinkSent] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);
  const [showSuccessLoader, setShowSuccessLoader] = useState(false);

  const { register: registerUser, login, forgotPassword, loginLoading } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors: fieldErrors },
  } = useForm();

  const changeAuthMode = (mode) => {
    setAuthMode(mode);
    setResetLinkSent(false);
    navigate(mode === 'register' ? '/register' : mode === 'forgot' ? '/forgot-password' : '/login');
  };

  useEffect(() => {
    setAuthMode(modeByPath[location.pathname] || 'login');
    setResetLinkSent(false);
  }, [location.pathname]);

  const submitForm = async (data) => {
    const { username, email, password, passwordConfirm } = data;

    if (authMode === 'register') {
      setIsRegisterSubmitting(true);

      try {
        await registerUser({ username, email, password, passwordConfirm });
        navigate('/verify-email', { replace: true });
      } catch (error) {
        setIsRegisterSubmitting(false);
        setError(error.field || 'form', {
          type: 'server',
          message: error.message,
        });
      }
    }

    if (authMode === 'login') {
      try {
        const data = await login({ email, password });
        setShowSuccessLoader(true);
        navigate(data.user?.isEmailVerified ? '/dashboard' : '/verify-email', { replace: true });
      } catch (error) {
        setError(error.field || 'form', {
          type: 'server',
          message: error.message,
        });
      }
    }

    if (authMode === 'forgot') {
      try {
        await forgotPassword({ email });
        setResetLinkSent(true);
      } catch (error) {
        setError(error.field || 'form', {
          type: 'server',
          message: error.message,
        });
      }
    }
  };

  return (
    <main className='user-auth-page'>
      {showSuccessLoader && <LoadingScreen />}
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

          {authMode === 'forgot' && resetLinkSent ? (
            <div className='auth-reset-success' role='status'>
              <MailCheck aria-hidden='true' />
              <h2>Password reset link sent to specified email</h2>
              <p>Check your inbox and follow the link to reset your password.</p>
              <button type='button' onClick={() => changeAuthMode('login')}>
                Back to login
              </button>
            </div>
          ) : authMode === 'register' && isRegisterSubmitting ? (
            <div className='auth-register-loading' role='status' aria-label='Creating your account'>
              <LoaderCircle aria-hidden='true' />
            </div>
          ) : (
            <form noValidate className='auth-form' onSubmit={handleSubmit(submitForm)}>
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
                      {...register('username', {
                        required: 'Username is required',
                        minLength: {
                          value: 3,
                          message: 'Username must be at least 3 characters',
                        },
                        maxLength: {
                          value: 15,
                          message: 'Username must be 15 characters or fewer',
                        },
                      })}
                      placeholder='Choose a username'
                      autoComplete='username'
                      autoCapitalize='none'
                      spellCheck='false'
                    />
                  </div>
                  {fieldErrors.username?.message && (
                    <small className='auth-field-error' role='alert'>
                      {fieldErrors.username.message}
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
                    placeholder='Enter your email'
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+\.\S+$/,
                        message: 'Enter a valid email address',
                      },
                    })}
                    autoComplete='email'
                  />
                </div>
                {fieldErrors.email?.message && (
                  <small className='auth-field-error' role='alert'>
                    {fieldErrors.email.message}
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
                      {...register(
                        'password',
                        authMode === 'register'
                          ? {
                              required: 'Password is required',
                              minLength: {
                                value: 8,
                                message: 'Password must be at least 8 characters',
                              },
                              pattern: {
                                value: /^(?=.*[A-Za-z])(?=.*\d).+$/,
                                message: 'Password must contain at least one letter and one number',
                              },
                            }
                          : {},
                      )}
                      autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    />
                    <button className='password-toggle' type='button' aria-label='Show password'>
                      <Eye aria-hidden='true' />
                    </button>
                  </div>
                  {fieldErrors.password?.message && (
                    <small className='auth-field-error' role='alert'>
                      {fieldErrors.password.message}
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
                      placeholder='Confirm your password'
                      {...register('passwordConfirm', {
                        required: 'Please confirm your password',
                        validate: (value) => value === getValues('password') || 'Passwords do not match',
                      })}
                      autoComplete='new-password'
                    />
                  </div>
                  {fieldErrors.passwordConfirm?.message && (
                    <small className='auth-field-error' role='alert'>
                      {fieldErrors.passwordConfirm.message}
                    </small>
                  )}
                </label>
              )}

              {fieldErrors.form && (
                <p className='auth-field-error auth-form-error' role='alert'>
                  {fieldErrors.form.message}
                </p>
              )}

              {authMode === 'login' && (
                <div className='auth-options'>
                  <label>
                    <input type='checkbox' defaultChecked />
                    <span>Remember me</span>
                  </label>
                  <button type='button' onClick={() => changeAuthMode('forgot')}>
                    Forgot password?
                  </button>
                </div>
              )}

              <button className='auth-submit' type='submit' disabled={authMode === 'login' && loginLoading}>
                {authMode === 'login' && loginLoading && <LoaderCircle aria-hidden='true' />}
                <span>
                  {authMode === 'login' ? 'Log In' : authMode === 'register' ? 'Create Account' : 'Send Reset Link'}
                </span>
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
          )}
        </section>
      </div>
    </main>
  );
};

export default UserAuthPage;
