import { useState } from 'react';
import './landing-page.css';

const LandingPage = () => {
  const [login, setLogin] = useState(false);

  function handleTryNow() {
    setLogin(true);
  }

  return (
    <>
      {!login ? (
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
      ) : (
        <h1>hello</h1>
      )}
    </>
  );
};

export default LandingPage;
