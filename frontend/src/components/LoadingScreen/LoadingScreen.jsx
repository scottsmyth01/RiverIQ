import './LoadingScreen.css';
import logo from '../Navbar_dashboard/logo.png';

const LoadingScreen = ({ visible = true }) => {
  return (
    <div
      className={`loading-screen${visible ? ' loading-screen--visible' : ''}`}
      role='dialog'
      aria-modal={visible ? 'true' : undefined}
      aria-label='Loading'
      aria-hidden={!visible}
    >
      <div className='loading-modal'>
        <img className='loading-logo' src={logo} alt='RiverIQ loading' />
      </div>
    </div>
  );
};

export default LoadingScreen;
