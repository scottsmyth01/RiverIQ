import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router';
import Navbar from './components/Navbar/Navbar';
import WebsiteFooter from './components/WebsiteFooter/WebsiteFooter';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import { useAuth } from './hooks/useAuth';
import { useSessions } from './hooks/useSessions';
import ProtectedRoute from './utils/ProtectedRoute';
import FeatureUploadGate from './components/FeatureUploadGate/FeatureUploadGate';
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
  const { isAuthenticated, isEmailVerified, loading, loginLoading, googleLoginLoading, logoutLoading } = useAuth();

  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isSignedOutOnlyRoute =
    pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname === '/help';
  const isVerifyEmailRoute = pathname.startsWith('/verify-email');
  const isPricingRoute = pathname === '/pricing';
  const isPaymentRoute = pathname === '/subscription/payment';
  const isResetPasswordRoute = pathname.startsWith('/reset-password');
  const isLegalRoute = pathname === '/terms' || pathname === '/privacy';
  const { isPending: isSessionsPending } = useSessions({ enabled: isDashboardRoute && isAuthenticated });

  // if user is authenticated and emailVerified then navigate the user to their dashboard
  // if the route is the pricing page then do not run this code
  const redirectToDashboard =
    isAuthenticated &&
    isEmailVerified &&
    !isDashboardRoute &&
    !isPricingRoute &&
    !isPaymentRoute &&
    !isResetPasswordRoute &&
    !isLegalRoute;

  // if user is authenticated, but email is not verified, then navigate to the /verify-email page
  const redirectToVerifyEmail = isAuthenticated && !isEmailVerified && !isVerifyEmailRoute && !isResetPasswordRoute;
  const isAuthRouteLoading = loading && (isDashboardRoute || isSignedOutOnlyRoute);
  const isLoginLoading = loginLoading || googleLoginLoading;
  const isDashboardDataLoading = isDashboardRoute && isAuthenticated && isSessionsPending;
  const isRedirectingAfterAuth = redirectToDashboard || redirectToVerifyEmail;
  const showGlobalLoading =
    logoutLoading || isLoginLoading || isAuthRouteLoading || isDashboardDataLoading || isRedirectingAfterAuth;
  const shouldRenderRouteContent = !logoutLoading && !isAuthRouteLoading && !isDashboardDataLoading;
  const showWebsiteChrome = !loading && !isAuthenticated && !isPaymentRoute;

  useEffect(() => {
    if (loading || isAuthenticated) return;
    document.documentElement.dataset.theme = 'dark';
  }, [isAuthenticated, loading]);

  return (
    <>
      <LoadingScreen visible={showGlobalLoading} />
      {shouldRenderRouteContent && redirectToDashboard && <Navigate to='/dashboard' replace />}
      {shouldRenderRouteContent && redirectToVerifyEmail && <Navigate to='/verify-email' replace />}
      {shouldRenderRouteContent && !redirectToDashboard && !redirectToVerifyEmail && (
        <>
          {showWebsiteChrome && <Navbar />}
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path='/' element={<Navigate to='/login' replace />} />
              <Route path='/features' element={<FeaturePage />} />
              <Route path='/pricing' element={<PricingPage />} />
              <Route
                path='/subscription/payment'
                element={
                  <ProtectedRoute>
                    <PaymentPage />
                  </ProtectedRoute>
                }
              />
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
                <Route
                  path='analytics'
                  element={
                    <FeatureUploadGate featureName='Analytics'>
                      <AnalyticsPage />
                    </FeatureUploadGate>
                  }
                />
                <Route
                  path='reports'
                  element={
                    <FeatureUploadGate featureName='Reports'>
                      <SavedReportsPage />
                    </FeatureUploadGate>
                  }
                />
                <Route
                  path='reports/new'
                  element={
                    <FeatureUploadGate featureName='Reports'>
                      <ReportsPage />
                    </FeatureUploadGate>
                  }
                />
                <Route path='reports/saved' element={<Navigate to='/dashboard/reports' replace />} />
                <Route path='goals' element={<GoalsPage />} />
                <Route
                  path='hand-history'
                  element={
                    <FeatureUploadGate featureName='Hand Charts'>
                      <HandChartsPage />
                    </FeatureUploadGate>
                  }
                />
                <Route path='help' element={<InfoPage />} />
                <Route path='settings' element={<SettingsPage />} />
              </Route>
              <Route path='*' element={<FeaturePage />} />
            </Routes>
          </Suspense>
          {showWebsiteChrome && <WebsiteFooter />}
        </>
      )}
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
