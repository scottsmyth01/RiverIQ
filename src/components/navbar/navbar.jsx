import './navbar.css';
import logo from './logo.png';

const Navbar = () => {
  return (
    <div className='nav-container '>
      <div className='nav-logo'>
        <img
          src={logo}
          alt='RiverIQ logo'
        />
        <h2>RiverIQ</h2>
      </div>
      <div className='nav-options'>
        <button className='btn-no-style'>Log In</button>
        <button className='btn-secondary'>Try Now</button>
      </div>
    </div>
  );
};

export default Navbar;
