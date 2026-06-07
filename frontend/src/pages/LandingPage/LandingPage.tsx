import { useReducer } from 'react';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import './LandingPage.css';

type AuthMode = 'home' | 'login' | 'register' | 'passwordReset';
type LandingAction =
  | 'showLogin'
  | 'showPasswordReset'
  | 'toggleAuthMode'
  | 'startSubmit'
  | 'finishSubmit';

type LandingState = {
  authMode: AuthMode;
  isLoading: boolean;
};

const initialLandingState: LandingState = {
  authMode: 'home',
  isLoading: false,
};

function reducer(state: LandingState, action: LandingAction): LandingState {
  switch (action) {
    case 'showLogin':
      return { ...state, authMode: 'login' };
    case 'showPasswordReset':
      return { ...state, authMode: 'passwordReset' };
    case 'toggleAuthMode':
      return {
        ...state,
        authMode: state.authMode === 'login' ? 'register' : 'login',
      };
    case 'startSubmit':
      return { ...state, isLoading: true };
    case 'finishSubmit':
      return { ...state, isLoading: false };
    default:
      return state;
  }
}

const LandingPage = () => {
  const [{ authMode, isLoading }, dispatch] = useReducer(
    reducer,
    initialLandingState,
  );

  function handleSubmit(event) {
    event.preventDefault();
    dispatch('startSubmit');

    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form.entries());

    setTimeout(() => {
      dispatch('finishSubmit');

      console.log(values);
    }, 2500);
  }

  return (
    <>
      {authMode === 'home' && (
        <div className='landing-hero'>
          <div className='landing-form'>
            <h1>RiverIQ</h1>
            <div className='landing-form-slogan'>
              <h4>Poker.</h4>
              <h4>Simply.</h4>
            </div>
            <button
              onClick={() => dispatch('showLogin')}
              className='btn-primary'
            >
              Try Now
            </button>
          </div>
        </div>
      )}
      {authMode !== 'home' && (
        <div className='register-page'>
          <section
            className={`register-panel ${
              authMode === 'login' || authMode === 'passwordReset'
                ? 'login-mode'
                : ''
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
              {authMode === 'login' && (
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
                      onClick={() => dispatch('showPasswordReset')}
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
                      onClick={() => dispatch('toggleAuthMode')}
                    >
                      Register now.
                    </button>
                  </p>
                </>
              )}

              {authMode === 'register' && (
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
                      onClick={() => dispatch('toggleAuthMode')}
                    >
                      Sign in.
                    </button>
                  </p>
                </>
              )}

              {authMode === 'passwordReset' && (
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
                      onClick={() => dispatch('showLogin')}
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
      {isLoading && <LoadingScreen />}
    </>
  );
};

export default LandingPage;
