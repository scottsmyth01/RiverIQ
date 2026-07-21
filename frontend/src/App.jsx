import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router';
import Navbar from './components/Navbar/Navbar';
import WebsiteFooter from './components/WebsiteFooter/WebsiteFooter';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './utils/ProtectedRoute';
import SessionsPage from './pages/SessionsPage';
import DashboardLayout from './components/DashboardLayout/DashboardLayout';
import DashboardSectionPage from './pages/DashboardSectionPage';
import AddSessionPage from './pages/AddSessionPage';
import SessionDetailPage from './pages/SessionDetailPage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import SavedReportsPage from './pages/SavedReportsPage';
import GoalsPage from './pages/GoalsPage';
import HandChartsPage from './pages/HandChartsPage';
import PaymentPage from './pages/PaymentPage';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const FeaturePage = lazy(() => import('./pages/FeaturePage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const UserAuthPage = lazy(() => import('./pages/UserAuthPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const InfoPage = lazy(() => import('./pages/InfoPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SessionStatsPage = lazy(() => import('./pages/SessionStatsPage'));

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
  const isPaymentRoute = pathname === '/subscription/payment';
  const isResetPasswordRoute = pathname.startsWith('/reset-password');
  const showWebsiteChrome = !isAuthenticated && !isPaymentRoute;

  useEffect(() => {
    if (loading || isAuthenticated) return;
    document.documentElement.dataset.theme = 'dark';
  }, [isAuthenticated, loading]);

  // if loading and a dashboard route we render the custom loading screen
  // if it is a route outside of the /dashboard then it will just load as normal (logged out routes)

  if (loading && isDashboardRoute) {
    return <LoadingScreen />;
  }

  // if user is authenticated and emailVerified then navigate the user to their dashboard
  // if the route is the pricing page then do not run this code
  if (
    isAuthenticated &&
    isEmailVerified &&
    !isDashboardRoute &&
    !isPricingRoute &&
    !isPaymentRoute &&
    !isResetPasswordRoute
  ) {
    return <Navigate to='/dashboard' replace />;
  }

  // if user is authenticated, but email is not verified, then navigate to the /verify-email page
  if (isAuthenticated && !isEmailVerified && !isVerifyEmailRoute && !isResetPasswordRoute) {
    return <Navigate to='/verify-email' replace />;
  }

  return (
    <>
      {showWebsiteChrome && <Navbar />}
      <Suspense fallback={isDashboardRoute ? <LoadingScreen /> : null}>
        <Routes>
          <Route path='/' element={<Navigate to='/login' replace />} />
          <Route path='/features' element={<FeaturePage />} />
          <Route path='/pricing' element={<PricingPage />} />
          <Route path='/subscription/payment' element={<PaymentPage />} />
          <Route path='/about' element={<AboutPage />} />
          <Route path='/faq' element={<FaqPage />} />
          <Route path='/help' element={<Navigate to='/login' replace />} />
          <Route path='/privacy' element={<PrivacyPage />} />
          <Route path='/terms' element={<TermsPage />} />
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
            <Route path='sessions/:id/stats' element={<SessionStatsPage />} />
            <Route path='sessions/:id' element={<SessionDetailPage />} />
            <Route path='sessions/new' element={<AddSessionPage />} />
            <Route path='analytics' element={<AnalyticsPage />} />
            <Route path='reports' element={<SavedReportsPage />} />
            <Route path='reports/new' element={<ReportsPage />} />
            <Route path='reports/saved' element={<Navigate to='/dashboard/reports' replace />} />
            <Route path='goals' element={<GoalsPage />} />
            <Route path='hand-history' element={<HandChartsPage />} />
            <Route path='help' element={<InfoPage />} />
            <Route path='settings' element={<SettingsPage />} />
          </Route>
          <Route path='*' element={<FeaturePage />} />
        </Routes>
      </Suspense>
      {showWebsiteChrome && <WebsiteFooter />}
    </>
  );
}

function App() {
  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  return (
    <BrowserRouter>
      <Elements stripe={stripePromise}>
        <ScrollToTop />
        <AppRoutes />
      </Elements>
    </BrowserRouter>
  );
}

export default App;
