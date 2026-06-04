import { useState } from 'react';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import './LandingPage.css';

const LandingPage = () => {
  const [authMode, setAuthMode] = useState('home');
  const [isLoading, setIsLoading] = useState(false);
  const isHomeMode = authMode === 'home';
  const isLoginMode = authMode === 'login';
  const isRegisterMode = authMode === 'register';
  const isPasswordResetMode = authMode === 'passwordReset';

  function handleTryNow() {
    setAuthMode('login');
  }

  function handlePasswordReset() {
    setAuthMode('passwordReset');
  }

  function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);

      const form = new FormData(event.currentTarget);
      const values = Object.fromEntries(form.entries());

      console.log(values);
    }, 2500);
  }

  function handleAuthModeToggle() {
    setAuthMode(isLoginMode ? 'register' : 'login');
  }

  function handleBackToLogin() {
    setAuthMode('login');
  }

  if (isLoading) {
    return <LoadingScreen />;
  } else {
    return (
      <>
        {isHomeMode && (
          <div className='landing-hero'>
            <div className='landing-form'>
              <h1>RiverIQ</h1>
              <div className='landing-form-slogan'>
                <h4>Poker.</h4>
                <h4>Simply.</h4>
              </div>
              <button
                onClick={handleTryNow}
                className='btn-primary'
              >
                Try Now
              </button>
            </div>
          </div>
        )}
        {!isHomeMode && (
          <div className='register-page'>
            <section
              className={`register-panel ${
                isLoginMode || isPasswordResetMode ? 'login-mode' : ''
              }`}
            >
              <div className='register-brand'>
                <h1>RiverIQ</h1>
                <p>
                  Poker.
                  <span>Simply.</span>
                </p>
                <br />
                <img
                  src='../../../public/logo.png'
                  style={{ width: '75px' }}
                />
              </div>

              <form
                className='register-form'
                onSubmit={handleSubmit}
              >
                {isLoginMode && (
                  <>
                    <h2>Login</h2>

                    <label htmlFor='login-username'>Email</label>
                    <input
                      id='login-email'
                      name='login-email'
                      type='text'
                      required
                    />

                    <label htmlFor='login-password'>Password</label>
                    <input
                      id='login-password'
                      type='password'
                      name='password'
                      required
                    />
                    <p
                      style={{ textAlign: 'left', marginTop: '15px' }}
                      className='member-prompt'
                    >
                      <button
                        style={{
                          fontWeight: '300',
                          textDecoration: 'none',
                        }}
                        onClick={handlePasswordReset}
                        type='button'
                      >
                        Forgot Password?
                      </button>
                    </p>
                    <button type='submit'>Login</button>

                    <p className='member-prompt'>
                      Need an account?{' '}
                      <button
                        type='button'
                        onClick={handleAuthModeToggle}
                      >
                        Register now.
                      </button>
                    </p>
                  </>
                )}

                {isRegisterMode && (
                  <>
                    <h2>Register</h2>

                    <label htmlFor='username'>Name</label>
                    <input
                      id='username'
                      name='username'
                      type='text'
                      required
                    />

                    <label htmlFor='email'>Email</label>
                    <input
                      id='email'
                      name='email'
                      type='email'
                      required
                    />

                    <label htmlFor='password'>Password</label>
                    <input
                      id='password'
                      type='password'
                      name='password'
                      required
                    />
                    <button type='submit'>Sign Up</button>

                    <p className='member-prompt'>
                      Already a member?{' '}
                      <button
                        type='button'
                        onClick={handleAuthModeToggle}
                      >
                        Sign in.
                      </button>
                    </p>
                  </>
                )}

                {isPasswordResetMode && (
                  <>
                    <h2>Reset Password</h2>

                    <label htmlFor='reset-email'>Email</label>
                    <input
                      id='reset-email'
                      name='reset-email'
                      type='email'
                      required
                    />

                    <button type='submit'>Send Reset Link</button>

                    <p className='member-prompt'>
                      Remembered it?{' '}
                      <button
                        type='button'
                        onClick={handleBackToLogin}
                      >
                        Back to login.
                      </button>
                    </p>
                  </>
                )}
              </form>
            </section>
          </div>
        )}
      </>
    );
  }
};

export default LandingPage;
