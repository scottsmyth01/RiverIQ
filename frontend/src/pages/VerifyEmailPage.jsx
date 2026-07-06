import { useEffect, useState } from 'react';
import { BadgeCheck, CircleAlert, LoaderCircle, MailCheck } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import './VerifyEmailPage.css';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const { isAuthenticated, isEmailVerified, verifyEmail } = useAuth();
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [isVerifying, setIsVerifying] = useState(Boolean(token) && !isEmailVerified);

  useEffect(() => {
    if (!token || isEmailVerified) return;

    const confirmEmail = async () => {
      try {
        await verifyEmail(token);
        setVerificationComplete(true);
      } catch (error) {
        setVerificationError(error.message);
      } finally {
        setIsVerifying(false);
      }
    };

    confirmEmail();
  }, [isEmailVerified, token, verifyEmail]);

  if (isVerifying) {
    return (
      <main className='verify-email-page'>
        <section className='verify-email-card' aria-live='polite'>
          <div className='verify-email-icon verify-email-icon--loading'>
            <LoaderCircle aria-hidden='true' />
          </div>
          <span className='verify-email-label'>One moment</span>
          <h1>Verifying your email...</h1>
        </section>
      </main>
    );
  }

  if (isEmailVerified || verificationComplete) {
    return (
      <main className='verify-email-page'>
        <section className='verify-email-card' aria-labelledby='verification-heading'>
          <div className='verify-email-icon'>
            <BadgeCheck aria-hidden='true' />
          </div>

          <span className='verify-email-label'>Verification complete</span>
          <h1 id='verification-heading'>Your email has been verified.</h1>
          <p>Your RiverIQ account is ready. You can now start tracking your game.</p>

          <Link className='verify-email-action' to={isAuthenticated ? '/dashboard' : '/login'}>
            {isAuthenticated ? 'Continue to dashboard' : 'Continue to login'}
          </Link>
        </section>
      </main>
    );
  }

  if (verificationError) {
    return (
      <main className='verify-email-page'>
        <section className='verify-email-card' role='alert'>
          <div className='verify-email-icon verify-email-icon--error'>
            <CircleAlert aria-hidden='true' />
          </div>
          <span className='verify-email-label verify-email-label--error'>Verification failed</span>
          <h1>We couldn’t verify your email.</h1>
          <p>{verificationError}</p>
        </section>
      </main>
    );
  }

  if (!isEmailVerified && !verificationComplete) {
    return (
      <main className='verify-email-page'>
        <section className='verify-email-card' aria-labelledby='verification-pending-heading'>
          <div className='verify-email-icon'>
            <MailCheck aria-hidden='true' />
          </div>
          <span className='verify-email-label'>Verification required</span>
          <h1 id='verification-pending-heading'>Please check your email for verification link.</h1>
        </section>
      </main>
    );
  }

  return null;
};

export default VerifyEmailPage;
