import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ProtectedRoute from './utils/ProtectedRoute';
import FeaturePage from './pages/FeaturePage';
import Navbar from './components/Navbar/Navbar';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import UserAuthPage from './pages/UserAuthPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage';
import SubscriptionPaymentPage from './pages/SubscriptionPaymentPage';
import SubscriptionConfirmationPage from './pages/SubscriptionConfirmationPage';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import { useAuth } from './context/AuthContext';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppRoutes() {
  const location = useLocation();
  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/forgot-password' ||
    location.pathname.startsWith('/reset-password/') ||
    location.pathname.startsWith('/verify-email');
  const isDashboardPage = location.pathname === '/dashboard';
  const isVerifyEmailPage = location.pathname.startsWith('/verify-email');
  const isSubscriptionPage = location.pathname.startsWith('/subscription/');

  const { isAuthenticated, isEmailVerified, loading, loginLoading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (isAuthenticated && isEmailVerified && !isDashboardPage && !isVerifyEmailPage && !isSubscriptionPage) {
    return <Navigate to='/dashboard' replace />;
  }

  if (isAuthenticated && !isEmailVerified && !isVerifyEmailPage) {
    return <Navigate to='/verify-email' replace />;
  }

  return (
    <>
      {loginLoading && <LoadingScreen />}
      {!isAuthPage && !isDashboardPage && !isSubscriptionPage && <Navbar />}
      <Routes>
        <Route path='/' element={<Navigate to='/features' replace />} />
        <Route path='/features' element={<FeaturePage />} />
        <Route path='/pricing' element={<PricingPage />} />
        <Route path='/about' element={<AboutPage />} />
        <Route path='/login' element={<UserAuthPage />} />
        <Route path='/register' element={<UserAuthPage />} />
        <Route path='/forgot-password' element={<UserAuthPage />} />
        <Route path='/reset-password/:id/:token' element={<ResetPasswordPage />} />
        <Route path='/verify-email' element={<VerifyEmailPage />} />
        <Route path='/verify-email/:token' element={<VerifyEmailPage />} />
        <Route
          path='/subscription/payment'
          element={
            <ProtectedRoute>
              <SubscriptionPaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/subscription/confirmation'
          element={
            <ProtectedRoute>
              <SubscriptionConfirmationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/dashboard'
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path='*' element={<FeaturePage />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
