import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ProtectedRoute from './utils/ProtectedRoute';
import FeaturePage from './pages/FeaturePage';
import Navbar from './components/Navbar/Navbar';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import UserAuthPage from './pages/UserAuthPage';

function AppRoutes() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <>
      {!isAuthPage && <Navbar />}
      <Routes>
        <Route path='/' element={<Navigate to='/features' replace />} />
        <Route path='/features' element={<FeaturePage />} />
        <Route path='/pricing' element={<PricingPage />} />
        <Route path='/about' element={<AboutPage />} />
        <Route path='/login' element={<UserAuthPage />} />
        <Route path='/register' element={<UserAuthPage />} />
        <Route path='*' element={<FeaturePage />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
