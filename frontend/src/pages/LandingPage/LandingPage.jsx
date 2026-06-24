import { useState } from 'react';
import './LandingPage.css';
import { useNavigate } from 'react-router-dom';

const LandingPage = ({ authMode }) => {
  const navigate = useNavigate();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const handleSubmit = function (e) {
    e.preventDefault();
  };

  return (
    <main className='landing-page'>
      {/* HOME SCREEN */}
      {authMode === 'home' && (
        <div className='landing-page__hero'>
          <div className='landing-page__home-card'>
            <h1 className='landing-page__home-title'>RiverIQ</h1>
            <div className='landing-page__home-slogan'>
              <h4 className='landing-page__home-slogan-line'>Poker.</h4>
              <h4 className='landing-page__home-slogan-line'>Simply.</h4>
            </div>
            <button onClick={() => navigate('/login')} className='landing-page__cta btn-primary'>
              Try Now
            </button>
          </div>
        </div>
      )}
      {authMode !== 'home' && (
        <div className='landing-page__auth'>
          <section
            className={`landing-page__auth-panel ${
              authMode === 'login' || authMode === 'passwordReset' ? 'landing-page__auth-panel--login' : ''
            }`}
          >
            <div className='landing-page__brand'>
              <h1 className='landing-page__brand-title'>RiverIQ</h1>
              <p className='landing-page__brand-slogan'>
                Poker.
                <span className='landing-page__brand-slogan-line'>Simply.</span>
              </p>
              <br />
              <img className='landing-page__brand-logo' src='/logo.png' alt='RiverIQ logo' />
            </div>

            <form className='landing-page__auth-form' onSubmit={handleSubmit}>
              {/* <LOGIN FORM */}
              {authMode === 'login' && (
                <>
                  <h2 className='landing-page__form-title'>Login</h2>

                  <label className='landing-page__form-label' htmlFor='login-email'>
                    Email
                  </label>
                  <input
                    className='landing-page__form-input'
                    id='login-email'
                    name='login-email'
                    type='text'
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />

                  <label className='landing-page__form-label' htmlFor='login-password'>
                    Password
                  </label>
                  <input
                    className='landing-page__form-input'
                    id='login-password'
                    type='password'
                    name='password'
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />

                  <p className='landing-page__member-prompt landing-page__member-prompt--forgot'>
                    <button
                      className='landing-page__member-action landing-page__member-action--subtle'
                      onClick={() => navigate('/resetPassword')}
                      type='button'
                    >
                      Forgot Password?
                    </button>
                  </p>
                  <button className='landing-page__submit' type='submit'>
                    Login
                  </button>

                  <p className='landing-page__member-prompt'>
                    Need an account?{' '}
                    <button className='landing-page__member-action' type='button' onClick={() => navigate('/register')}>
                      Register now.
                    </button>
                  </p>
                </>
              )}
              {/* REGISTER FORM */}
              {authMode === 'register' && (
                <>
                  <h2 className='landing-page__form-title'>Register</h2>

                  <label
                    className='landing-page__form-label'
                    htmlFor='username'
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                  >
                    Username
                  </label>
                  <input className='landing-page__form-input' id='username' name='username' type='text' required />

                  <label
                    className='landing-page__form-label'
                    htmlFor='email'
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                  >
                    Email
                  </label>
                  <input className='landing-page__form-input' id='email' name='email' type='email' required />

                  <label
                    className='landing-page__form-label'
                    htmlFor='password'
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                  >
                    Password
                  </label>
                  <input className='landing-page__form-input' id='password' type='password' name='password' required />
                  <button className='landing-page__submit' type='submit'>
                    Sign Up
                  </button>

                  <p className='landing-page__member-prompt'>
                    Already a member?{' '}
                    <button className='landing-page__member-action' type='button' onClick={() => navigate('/login')}>
                      Sign in.
                    </button>
                  </p>
                </>
              )}
              {/* PASSWORD RESET FORM */}
              {authMode === 'passwordReset' && (
                <>
                  <h2 className='landing-page__form-title'>Reset Password</h2>

                  <label className='landing-page__form-label' htmlFor='reset-email'>
                    Email
                  </label>
                  <input
                    className='landing-page__form-input'
                    id='reset-email'
                    name='reset-email'
                    type='email'
                    required
                  />

                  <button className='landing-page__submit' type='submit'>
                    Send Reset Link
                  </button>

                  <p className='landing-page__member-prompt'>
                    Remembered it?{' '}
                    <button className='landing-page__member-action' type='button' onClick={() => navigate('/login')}>
                      Back to login.
                    </button>
                  </p>
                </>
              )}
            </form>
          </section>
        </div>
      )}
      {/* show loading modal if isLoading is true */}
      {/* {isLoading && <LoadingScreen />} */}
    </main>
  );
};

export default LandingPage;
