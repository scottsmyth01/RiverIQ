import logo from '../../../public/logo.png';
import './LoadingScreen.css';

const LoadingScreen = () => {
  return (
    <div
      className='loading-screen'
      role='dialog'
      aria-modal='true'
      aria-label='Loading'
    >
      <div className='loading-modal'>
        <img
          className='loading-logo'
          src={logo}
          alt='RiverIQ loading'
        />
      </div>
    </div>
  );
};

export default LoadingScreen;
