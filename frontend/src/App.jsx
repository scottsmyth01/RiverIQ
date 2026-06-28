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
  const { pathname } = useLocation();
  const { isAuthenticated, isEmailVerified, loading, loginLoading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (isAuthenticated && isEmailVerified && !pathname.startsWith('/dashboard')) {
    return <Navigate to='/dashboard' replace />;
  }

  if (isAuthenticated && !isEmailVerified) {
    return <Navigate to='/verify-email' replace />;
  }

  return (
    <>
      {loginLoading && <LoadingScreen />}
      {!isAuthenticated && <Navbar />}
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
          path='/dashboard'
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/dashboard/sessions'
          element={
            <ProtectedRoute>
              <DashboardPage current='sessions' />
            </ProtectedRoute>
          }
        ></Route>
        <Route
          path='/dashboard/analytics'
          element={
            <ProtectedRoute>
              <DashboardPage current='analytics' />
            </ProtectedRoute>
          }
        ></Route>
        <Route
          path='/dashboard/reports'
          element={
            <ProtectedRoute>
              <DashboardPage current='reports' />
            </ProtectedRoute>
          }
        ></Route>
        <Route
          path='/dashboard/goals'
          element={
            <ProtectedRoute>
              <DashboardPage current='goals' />
            </ProtectedRoute>
          }
        ></Route>
        <Route
          path='/dashboard/settings'
          element={
            <ProtectedRoute>
              <DashboardPage current='settings' />
            </ProtectedRoute>
          }
        ></Route>
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
