import { Navigate } from 'react-router';
import LoadingScreen from '../components/LoadingScreen/LoadingScreen';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) return <Navigate to='/login' replace />;

  return children;
}

export default ProtectedRoute;
