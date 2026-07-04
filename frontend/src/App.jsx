import { lazy, Suspense, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router';
import Navbar from './components/Navbar/Navbar';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import { useAuth } from './context/AuthContext';
import { selectSessionsLoading } from './store/sessionSlice';
import ProtectedRoute from './utils/ProtectedRoute';
import SessionsPage from './pages/SessionsPage';
import DashboardLayout from './components/DashboardLayout/DashboardLayout';
import DashboardSectionPage from './pages/DashboardSectionPage';
import AddSessionPage from './pages/AddSessionPage';

const FeaturePage = lazy(() => import('./pages/FeaturePage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const UserAuthPage = lazy(() => import('./pages/UserAuthPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

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

  const sessionsLoading = useSelector(selectSessionsLoading);
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isPricingRoute = pathname === '/pricing';
  const isVerifyEmailRoute = pathname.startsWith('/verify-email');
  const showLoadingScreen = loginLoading || sessionsLoading;

  if (loading && isDashboardRoute) {
    return <LoadingScreen />;
  }

  if (isAuthenticated && isEmailVerified && !isDashboardRoute && !isPricingRoute) {
    return <Navigate to='/dashboard' replace />;
  }

  if (isAuthenticated && !isEmailVerified && !isVerifyEmailRoute) {
    return <Navigate to='/verify-email' replace />;
  }

  return (
    <>
      {showLoadingScreen && <LoadingScreen />}
      {!isAuthenticated && !showLoadingScreen && <Navbar />}
      <Suspense fallback={isDashboardRoute ? <LoadingScreen /> : null}>
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
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path='sessions' element={<SessionsPage />} />
            <Route path='analytics' element={<SessionsPage />} />
            <Route path='reports' element={<SessionsPage />} />
            <Route path='goals' element={<SessionsPage />} />
            <Route path='hand-history' element={<SessionsPage />} />
            <Route path='sessions/new' element={<AddSessionPage />} />
          </Route>
          <Route path='*' element={<FeaturePage />} />
        </Routes>
      </Suspense>
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
