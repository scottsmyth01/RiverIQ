import { lazy, Suspense, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router';
import Navbar from './components/Navbar/Navbar';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import { useAuth } from './context/AuthContext';
import { selectSessionsLoading } from './store/sessionSlice';
import ProtectedRoute from './utils/ProtectedRoute';

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

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated && isEmailVerified && !pathname.startsWith('/dashboard')) {
    return <Navigate to='/dashboard' replace />;
  }

  if (isAuthenticated && !isEmailVerified) {
    return <Navigate to='/verify-email' replace />;
  }

  return (
    <>
      {(loginLoading || sessionsLoading) && <LoadingScreen />}
      {!isAuthenticated && <Navbar />}
      <Suspense fallback={<LoadingScreen />}>
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
