import './LoadingScreen.css';
import logo from '../Navbar_dashboard/logo.png';

const LoadingScreen = ({ children, label = 'Loading', visible = true }) => {
  return (
    <div
      className={`loading-screen${visible ? ' loading-screen--visible' : ''}`}
      role='dialog'
      aria-modal={visible ? 'true' : undefined}
      aria-label={label}
      aria-hidden={!visible}
    >
      <div className='loading-modal'>
        <img className='loading-logo' src={logo} alt='RiverIQ loading' />
        {children}
      </div>
    </div>
  );
};

export default LoadingScreen;
