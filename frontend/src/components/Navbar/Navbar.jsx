import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import './Navbar.css';
import logo from './logo.png';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className='navbar'>
      <div className='navbar-container'>
        <Link to='/features' className='logo'>
          <img src={logo} alt='' />
          <div className='logo-text'>
            <span>River</span>
            <span className='iq'>IQ</span>
          </div>
        </Link>
        <div className='nav-links'>
          <NavLink to='/features' className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Features
          </NavLink>
          <NavLink to='/pricing' className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Pricing
          </NavLink>
          <NavLink to='/about' className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            About
          </NavLink>
        </div>

        <div className='nav-actions'>
          <Link to='/login' className='login-link'>
            Login
          </Link>
          <Link to='/register' className='start-free-button'>
            Start Free
          </Link>
          <button
            className={`mobile-menu-button ${isMenuOpen ? 'open' : ''}`}
            type='button'
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
            aria-controls='mobile-navigation'
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      <div id='mobile-navigation' className={`mobile-nav-menu ${isMenuOpen ? 'open' : ''}`}>
        <NavLink
          to='/features'
          className={({ isActive }) => (isActive ? 'mobile-nav-link active' : 'mobile-nav-link')}
          onClick={closeMenu}
        >
          Features
        </NavLink>
        <NavLink
          to='/pricing'
          className={({ isActive }) => (isActive ? 'mobile-nav-link active' : 'mobile-nav-link')}
          onClick={closeMenu}
        >
          Pricing
        </NavLink>
        <NavLink
          to='/about'
          className={({ isActive }) => (isActive ? 'mobile-nav-link active' : 'mobile-nav-link')}
          onClick={closeMenu}
        >
          About
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
