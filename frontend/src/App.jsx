import { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import LandingPage from './pages/LandingPage/LandingPage';

function Homepage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  function handleLogout() {
    setIsLoggedIn(false);
  }
  return (
    <BrowserRouter>
      <Navbar isLoggedIn={isLoggedIn} handleLogout={handleLogout} />

      <Routes>
        <Route path='/' element={<LandingPage authMode='home' />} />
        <Route path='/login' element={<LandingPage authMode='login' />} />
        <Route path='/register' element={<LandingPage authMode='register' />} />
        <Route path='/resetPassword' element={<LandingPage authMode='passwordReset' />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Homepage;
