import { useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Check,
  CircleHelp,
  CreditCard,
  Crown,
  Gift,
  LockKeyhole,
  ShieldCheck,
  Spade,
  Star,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './SubscriptionPaymentPage.css';

const proFeatures = [
  'Unlimited sessions',
  'Advanced analytics & reports',
  'Hand history upload & parsing',
  'Preflop charts & ranges',
  'Export data (CSV)',
  'Priority support',
];

const formatCardNumber = (value) =>
  value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits;
};

const SubscriptionPaymentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: user?.username || '',
    email: user?.email || '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    postalCode: '',
  });

  const initials = (user?.username || user?.email || 'RI')
    .split(/[\s@._-]+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleChange = (event) => {
    const { name, value } = event.target;
    let nextValue = value;

    if (name === 'cardNumber') nextValue = formatCardNumber(value);
    if (name === 'expiry') nextValue = formatExpiry(value);
    if (name === 'cvc') nextValue = value.replace(/\D/g, '').slice(0, 4);

    setFormData((currentData) => ({ ...currentData, [name]: nextValue }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Connect your payment provider here before navigating.
    navigate('/subscription/confirmation', {
      state: {
        customerName: formData.fullName,
        email: formData.email,
      },
    });
  };

  return (
    <main className='subscription-checkout'>
      <header className='checkout-header'>
        <Link className='checkout-brand' to='/dashboard'>
          <Spade aria-hidden='true' />
          <span>
            River<strong>IQ</strong>
          </span>
        </Link>

        <div className='checkout-user'>
          <button type='button' aria-label='Notifications'>
            <Bell aria-hidden='true' />
          </button>
          <span className='checkout-avatar'>{initials}</span>
          <span>{user?.username || 'RiverIQ Player'}</span>
        </div>
      </header>

      <div className='checkout-layout'>
        <section className='checkout-main'>
          <Link className='checkout-back-link' to='/pricing'>
            <ArrowLeft aria-hidden='true' />
            Back to Subscription
          </Link>

          <div className='checkout-intro'>
            <h1>Start Your Pro Trial</h1>
            <p>You’re seconds away from unlocking powerful tools to analyze your game and sharpen your edge.</p>
          </div>

          <ol className='checkout-steps' aria-label='Checkout progress'>
            <li className='active'>
              <span>1</span>
              <strong>Payment</strong>
            </li>
            <li>
              <span>2</span>
              <strong>Confirmation</strong>
            </li>
          </ol>

          <div className='trial-banner'>
            <Gift aria-hidden='true' />
            <span>7-day free trial</span>
            <i>•</i>
            <span>Cancel anytime</span>
            <i>•</i>
            <span>No charges today</span>
          </div>

          <form className='checkout-form' onSubmit={handleSubmit}>
            <section className='checkout-form-card'>
              <div className='form-card-heading'>
                <span>1</span>
                <div>
                  <h2>Account Information</h2>
                  <p>This account will be connected to your Pro plan.</p>
                </div>
              </div>

              <div className='checkout-field-grid'>
                <label className='checkout-field'>
                  <span>Full Name</span>
                  <input
                    type='text'
                    name='fullName'
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder='Your full name'
                    autoComplete='name'
                    required
                  />
                </label>

                <label className='checkout-field'>
                  <span>Email</span>
                  <input
                    type='email'
                    name='email'
                    value={formData.email}
                    onChange={handleChange}
                    placeholder='you@example.com'
                    autoComplete='email'
                    required
                  />
                </label>
              </div>
            </section>

            <section className='checkout-form-card'>
              <div className='form-card-heading'>
                <span>2</span>
                <div>
                  <h2>Payment Information</h2>
                  <p>
                    <LockKeyhole aria-hidden='true' />
                    Your card won’t be charged until your trial ends.
                  </p>
                </div>
              </div>

              <label className='checkout-field'>
                <span>Card Number</span>
                <div className='checkout-input-with-icon'>
                  <CreditCard aria-hidden='true' />
                  <input
                    type='text'
                    inputMode='numeric'
                    name='cardNumber'
                    value={formData.cardNumber}
                    onChange={handleChange}
                    placeholder='4242 4242 4242 4242'
                    autoComplete='cc-number'
                    required
                  />
                  <div className='card-marks' aria-hidden='true'>
                    <b>VISA</b>
                    <b>MC</b>
                    <b>AMEX</b>
                  </div>
                </div>
              </label>

              <div className='checkout-field-grid'>
                <label className='checkout-field'>
                  <span>Expiry Date</span>
                  <input
                    type='text'
                    inputMode='numeric'
                    name='expiry'
                    value={formData.expiry}
                    onChange={handleChange}
                    placeholder='MM / YY'
                    autoComplete='cc-exp'
                    required
                  />
                </label>

                <label className='checkout-field'>
                  <span>CVC</span>
                  <div className='checkout-input-with-icon checkout-input-with-icon--trailing'>
                    <input
                      type='text'
                      inputMode='numeric'
                      name='cvc'
                      value={formData.cvc}
                      onChange={handleChange}
                      placeholder='123'
                      autoComplete='cc-csc'
                      required
                    />
                    <CircleHelp aria-hidden='true' />
                  </div>
                </label>
              </div>

              <label className='checkout-field'>
                <span>Zip / Postal Code</span>
                <input
                  type='text'
                  name='postalCode'
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder='M5V 2T6'
                  autoComplete='postal-code'
                  required
                />
              </label>

              <button className='checkout-submit' type='submit'>
                <LockKeyhole aria-hidden='true' />
                Start 7-Day Free Trial
              </button>

              <p className='checkout-charge-note'>
                After your trial ends, you’ll be charged $19.99 CAD/month.
                <br />
                Cancel anytime from your account settings.
              </p>
            </section>
          </form>

          <p className='checkout-legal'>
            By starting your free trial, you agree to our <a href='#terms'>Terms of Service</a> and{' '}
            <a href='#privacy'>Privacy Policy</a>.
          </p>
        </section>

        <aside className='checkout-sidebar'>
          <section className='checkout-summary-card'>
            <h2>Order Summary</h2>
            <div className='plan-icon'>
              <Crown aria-hidden='true' />
            </div>
            <h3>Pro Plan</h3>
            <p>7-Day Free Trial</p>

            <div className='summary-pricing'>
              <span>
                Trial Today <strong>$0.00</strong>
              </span>
              <span>
                After Trial <strong>$19.99 USD / month</strong>
              </span>
            </div>

            <ul className='summary-features'>
              {proFeatures.map((feature) => (
                <li key={feature}>
                  <Check aria-hidden='true' />
                  {feature}
                </li>
              ))}
            </ul>
          </section>

          <section className='checkout-side-card secure-checkout-card'>
            <h3>
              <LockKeyhole aria-hidden='true' />
              Secure Checkout
            </h3>
            <p>
              <ShieldCheck aria-hidden='true' />
              Your payment information is encrypted and secure.
            </p>
            <div>
              <strong>stripe</strong>
              <span>256-bit SSL</span>
            </div>
          </section>

          <section className='checkout-side-card'>
            <h3>Love RiverIQ?</h3>
            <blockquote>“This tool has completely transformed the way I review my game.”</blockquote>
            <span>— Verified User</span>
            <div className='checkout-stars' aria-label='5 out of 5 stars'>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} aria-hidden='true' />
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
};

export default SubscriptionPaymentPage;
