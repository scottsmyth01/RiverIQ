import { useEffect, useState } from 'react';
import { CheckCircle2, Lock, Spade } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen/LoadingScreen';
import './ResetPasswordPage.css';

const ResetPasswordPage = () => {
  const { id, token } = useParams();
  const { validateResetToken, resetPassword } = useAuth();
  const [isValidating, setIsValidating] = useState(true);
  const [linkError, setLinkError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isComplete, setIsComplete] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    passwordConfirm: '',
  });

  useEffect(() => {
    const validateLink = async () => {
      try {
        await validateResetToken(id, token);
      } catch (error) {
        setLinkError(error.message);
      } finally {
        setIsValidating(false);
      }
    };

    validateLink();
  }, [id, token, validateResetToken]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '', form: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFieldErrors({});

    try {
      await resetPassword(id, token, formData);
      setIsComplete(true);
    } catch (error) {
      setFieldErrors({ [error.field || 'form']: error.message });
    }
  };

  if (isValidating) return <LoadingScreen />;

  return (
    <main className='reset-password-page'>
      <Link className='reset-password-brand' to='/'>
        <Spade aria-hidden='true' />
        <span>
          River<b>IQ</b>
        </span>
      </Link>

      <section className='reset-password-panel'>
        {linkError ? (
          <div className='reset-password-status'>
            <h1>Reset link unavailable</h1>
            <p>{linkError}</p>
            <Link to='/forgot-password'>Request a new link</Link>
          </div>
        ) : isComplete ? (
          <div className='reset-password-status'>
            <CheckCircle2 aria-hidden='true' />
            <h1>Password updated</h1>
            <p>Your password has been reset successfully. You can now log in with your new password.</p>
            <Link to='/login'>Go to login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className='reset-password-heading'>
              <h1>Create a new password</h1>
              <p>Choose a secure password with at least eight characters, one letter, and one number.</p>
            </div>

            <label className={fieldErrors.password ? 'has-error' : ''}>
              <span>New password</span>
              <div>
                <Lock aria-hidden='true' />
                <input
                  type='password'
                  name='password'
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete='new-password'
                  placeholder='Enter your new password'
                />
              </div>
              {fieldErrors.password && <small>{fieldErrors.password}</small>}
            </label>

            <label className={fieldErrors.passwordConfirm ? 'has-error' : ''}>
              <span>Confirm new password</span>
              <div>
                <Lock aria-hidden='true' />
                <input
                  type='password'
                  name='passwordConfirm'
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  autoComplete='new-password'
                  placeholder='Confirm your new password'
                />
              </div>
              {fieldErrors.passwordConfirm && <small>{fieldErrors.passwordConfirm}</small>}
            </label>

            {fieldErrors.form && <p className='reset-password-error'>{fieldErrors.form}</p>}

            <button className='reset-password-submit' type='submit'>
              Reset password
            </button>
          </form>
        )}
      </section>
    </main>
  );
};

export default ResetPasswordPage;
