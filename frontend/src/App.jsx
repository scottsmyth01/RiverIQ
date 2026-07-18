import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router';
import Navbar from './components/Navbar/Navbar';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './utils/ProtectedRoute';
import SessionsPage from './pages/SessionsPage';
import DashboardLayout from './components/DashboardLayout/DashboardLayout';
import DashboardSectionPage from './pages/DashboardSectionPage';
import AddSessionPage from './pages/AddSessionPage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import SavedReportsPage from './pages/SavedReportsPage';
import GoalsPage from './pages/GoalsPage';
import HandChartsPage from './pages/HandChartsPage';

const FeaturePage = lazy(() => import('./pages/FeaturePage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const UserAuthPage = lazy(() => import('./pages/UserAuthPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppRoutes() {
  const { pathname } = useLocation();
  const { isAuthenticated, isEmailVerified, loading } = useAuth();

  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isVerifyEmailRoute = pathname.startsWith('/verify-email');
  const isPricingRoute = pathname === '/pricing';

  // if loading and a dashboard route we render the custom loading screen
  // if it is a route outside of the /dashboard then it will just load as normal (logged out routes)

  if (loading && isDashboardRoute) {
    return <LoadingScreen />;
  }

  // if user is authenticated and emailVerified then navigate the user to their dashboard
  // if the route is the pricing page then do not run this code
  if (isAuthenticated && isEmailVerified && !isDashboardRoute && !isPricingRoute) {
    return <Navigate to='/dashboard' replace />;
  }

  // if user is authenticated, but email is not verified, then navigate to the /verify-email page
  if (isAuthenticated && !isEmailVerified && !isVerifyEmailRoute) {
    return <Navigate to='/verify-email' replace />;
  }

  return (
    <>
      {!isAuthenticated && <Navbar />}
      <Suspense fallback={isDashboardRoute ? <LoadingScreen /> : null}>
        <Routes>
          <Route path='/' element={<Navigate to='/login' replace />} />
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
            <Route path='analytics' element={<AnalyticsPage />} />
            <Route path='reports' element={<ReportsPage />} />
            <Route path='reports/saved' element={<SavedReportsPage />} />
            <Route path='goals' element={<GoalsPage />} />
            <Route path='hand-history' element={<HandChartsPage />} />
            <Route path='sessions/new' element={<AddSessionPage />} />
            <Route path='settings' element={<SettingsPage />} />
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
