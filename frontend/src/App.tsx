import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import LandingPage from './pages/LandingPage/LandingPage';

function Homepage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  function handleLoginSuccess() {
    setIsLoggedIn(true);
  }
  function handleLogout() {
    setIsLoggedIn(false);
  }
  return (
    <BrowserRouter>
      <Navbar isLoggedIn={isLoggedIn} handleLogout={handleLogout} />

      <Routes>
        <Route path='/' element={<LandingPage initialAuthMode='home' />} />
        <Route path='/login' element={<LandingPage initialAuthMode='login' />} />
        <Route path='/register' element={<LandingPage initialAuthMode='register' />} />
        <Route path='/resetPassword' element={<LandingPage initialAuthMode='passwordReset' />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Homepage;
