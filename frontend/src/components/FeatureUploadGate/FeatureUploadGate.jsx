import { Link, Navigate } from 'react-router';
import { LockKeyhole, Upload } from 'lucide-react';
import LoadingScreen from '../LoadingScreen/LoadingScreen';
import { useAuth } from '../../hooks/useAuth';
import { useSessions } from '../../hooks/useSessions';
import './FeatureUploadGate.css';

const FeatureUploadGate = ({ children, featureName = 'This feature' }) => {
  const { user } = useAuth();
  const { data: sessions = [], isPending } = useSessions();

  if (isPending) {
    return <LoadingScreen />;
  }

  if (user?.subscription !== 'pro') {
    return <Navigate to='/subscription/payment' replace />;
  }

  if (sessions.length < 1) {
    return (
      <section className='feature-upload-gate'>
        <div className='feature-upload-gate__icon' aria-hidden='true'>
          <LockKeyhole />
        </div>
        <div className='feature-upload-gate__copy'>
          <span>Upload Required</span>
          <h1>{featureName} is locked</h1>
          <p>Upload your first poker session to activate Analytics, Reports, and Hand Charts.</p>
        </div>
        <Link className='feature-upload-gate__button' to='/dashboard/sessions/new'>
          <Upload aria-hidden='true' />
          <span>Upload Session</span>
        </Link>
      </section>
    );
  }

  return children;
};

export default FeatureUploadGate;
