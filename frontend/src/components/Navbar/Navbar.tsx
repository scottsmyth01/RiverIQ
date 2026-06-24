import './Navbar.css';

const Navbar = ({ isLoggedIn, handleLogout }) => {
  return (
    <div className='nav-container '>
      <a
        className='nav-logo'
        href='/'
      >
        <img
          src='/logo.png'
          alt='RiverIQ logo'
        />
        <h2>RiverIQ</h2>
      </a>
      <div className='nav-options'>
        <button className='btn-no-style'>Log In</button>
        <button className='btn-secondary'>Try Now</button>
      </div>
    </div>
  );
};

export default Navbar;
