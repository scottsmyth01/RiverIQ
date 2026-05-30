import './landing-page.css';

const LandingPage = () => {
  return (
    <div className='landing-hero'>
      <div className='landing-form'>
        <h1>RiverIQ</h1>
        <div className='landing-form-slogan'>
          <h4>Poker.</h4>
          <h4>Simply.</h4>
        </div>
        <button className='btn-primary'>Try Now</button>
      </div>
    </div>
  );
};

export default LandingPage;
