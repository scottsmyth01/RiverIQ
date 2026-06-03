import logo from '../../../public/logo.png';
import './LoadingScreen.css';

const LoadingScreen = () => {
  return (
    <div className='loading-screen'>
      <img
        className='loading-logo'
        src={logo}
        alt='RiverIQ loading'
      />
    </div>
  );
};

export default LoadingScreen;
