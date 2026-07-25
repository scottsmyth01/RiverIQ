import './PaymentPage.css';

import { CardCvcElement, CardExpiryElement, CardNumberElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  CircleHelp,
  CreditCard,
  Crown,
  LoaderCircle,
  Lock,
  ShieldCheck,
  Sparkle,
  Star,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router';
import Navbar from '../components/Navbar_dashboard/Navbar';
import { useAuth } from '../hooks/useAuth';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const cardElementOptions = {
  style: {
    base: {
      color: '#dfe7ef',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '13.76px',
      fontWeight: '700',
      lineHeight: '42px',
      '::placeholder': {
        color: '#6f7d91',
      },
    },
    invalid: {
      color: '#fca5a5',
    },
  },
};

const includedFeatures = [
  'Unlimited Sessions',
  'Session Statistics',
  'Advanced Analytics & Reports',
  'Goal Tracking',
  'Hand Charts',
  'Export data (CSV)',
  'Priority Support',
];

const billingPlans = {
  monthly: {
    label: 'Monthly',
    price: '$14.99 USD',
    cadence: 'per month',
    renewal: 'Renews monthly',
    summary: '$14.99 USD / month',
    note: "You'll be charged $14.99 USD per month.",
  },
  yearly: {
    label: 'Yearly',
    price: '$149.99 USD',
    cadence: 'per year',
    renewal: 'Renews yearly',
    summary: '$149.99 USD / year',
    note: "You'll be charged $149.99 USD per year.",
    badge: 'Save $29.89',
  },
};

function getDisplayName(user) {
  return user?.username || user?.fullName || user?.name;
}

function getEmail(user) {
  return user?.email;
}

const PaymentPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [billingInterval, setBillingInterval] = useState(() =>
    searchParams.get('billing') === 'yearly' ? 'yearly' : 'monthly',
  );
  const displayName = getDisplayName(user);
  const email = getEmail(user);
  const planPrice = billingPlans[billingInterval];
  const stripe = useStripe();
  const elements = useElements();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: fieldErrors, isSubmitting },
  } = useForm({
    defaultValues: {
      fullName: displayName,
      email,
      postalCode: '90210',
    },
  });

  async function submitPayment(formData) {
    if (!stripe || !elements) {
      return;
    }

    setPaymentError('');

    try {
      const cardElement = elements.getElement(CardNumberElement);
      const res = await fetch(`${API_URL}/api/payments/subscribe`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, billingInterval }),
      });

      const responseText = await res.text();
      const data = responseText ? JSON.parse(responseText) : {};

      if (!res.ok) {
        throw new Error(data.message || 'Unable to create subscription');
      }

      if (!data.clientSecret) {
        throw new Error('Missing subscription client secret');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: formData.fullName,
            email: formData.email,
            address: {
              postal_code: formData.postalCode,
            },
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Unable to confirm payment');
      }

      const confirmRes = await fetch(`${API_URL}/api/payments/subscription/confirm`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: data.subscriptionId,
          paymentIntentId: paymentIntent?.id,
        }),
      });

      const confirmResponseText = await confirmRes.text();
      const confirmData = confirmResponseText ? JSON.parse(confirmResponseText) : {};

      if (!confirmRes.ok) {
        throw new Error(confirmData.message || 'Unable to activate subscription');
      }

      if (confirmData.user) {
        queryClient.setQueryData(['authUser'], { user: confirmData.user });
      }

      setShowSuccessModal(true);
    } catch (error) {
      setPaymentError(error.message || 'Unable to process payment');
    }
  }

  useEffect(() => {
    reset({
      fullName: displayName,
      email,
      postalCode: '90210',
    });
  }, [displayName, email, reset]);

  useEffect(() => {
    const queryBilling = searchParams.get('billing') === 'yearly' ? 'yearly' : 'monthly';
    setBillingInterval(queryBilling);
  }, [searchParams]);

  function selectBillingInterval(nextBillingInterval) {
    setBillingInterval(nextBillingInterval);
    setSearchParams(nextBillingInterval === 'yearly' ? { billing: 'yearly' } : {});
  }

  return (
    <main className='payment-page'>
      <Navbar />

      <div className='payment-shell'>
        <section className='payment-main-panel'>
          <Link className='payment-back-link' to='/pricing'>
            <ArrowLeft aria-hidden='true' />
            Back to Subscription
          </Link>

          <header className='payment-hero'>
            <h1>Subscribe to RiverIQ Pro</h1>
            <p>
              Unlock powerful tools to analyze your game, review your sessions, and take your poker to the next level.
            </p>
          </header>

          <form className='payment-form' autoComplete='off' onSubmit={handleSubmit(submitPayment)}>
            <section className='payment-form-card'>
              <h2>1. Account Information</h2>
              <p>You&apos;ll be using this account for your Pro plan.</p>

              <div className='payment-field-grid'>
                <label className={fieldErrors.fullName ? 'has-error' : ''}>
                  <span>Full Name</span>
                  <input
                    autoComplete='name'
                    {...register('fullName', {
                      required: 'Full name is required',
                      minLength: {
                        value: 2,
                        message: 'Full name must be at least 2 characters',
                      },
                    })}
                  />
                  {fieldErrors.fullName?.message && (
                    <small className='payment-field-error' role='alert'>
                      {fieldErrors.fullName.message}
                    </small>
                  )}
                </label>
                <label className={fieldErrors.email ? 'has-error' : ''}>
                  <span>Email</span>
                  <input
                    autoComplete='email'
                    type='email'
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+\.\S+$/,
                        message: 'Enter a valid email address',
                      },
                    })}
                  />
                  {fieldErrors.email?.message && (
                    <small className='payment-field-error' role='alert'>
                      {fieldErrors.email.message}
                    </small>
                  )}
                </label>
              </div>
            </section>

            <section className='payment-form-card'>
              <h2>2. Billing Cycle</h2>
              <p>Choose how you want your RiverIQ Pro subscription to renew.</p>

              <div className='payment-billing-options' role='radiogroup' aria-label='Billing cycle'>
                {Object.entries(billingPlans).map(([interval, plan]) => (
                  <button
                    className={`payment-billing-option${billingInterval === interval ? ' active' : ''}`}
                    type='button'
                    role='radio'
                    aria-checked={billingInterval === interval}
                    key={interval}
                    onClick={() => selectBillingInterval(interval)}
                  >
                    <span>
                      <strong>{plan.label}</strong>
                      {plan.badge && <em>{plan.badge}</em>}
                    </span>
                    <span>
                      <strong>{plan.price}</strong>
                      <small>{plan.cadence}</small>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className='payment-form-card'>
              <h2>3. Payment Information</h2>
              <p className='payment-lock-note'>
                <Lock aria-hidden='true' />
                Your card will be charged when you subscribe.
              </p>

              <label className='payment-field-full'>
                <span>Card Number</span>
                <div className='payment-card-input'>
                  <CreditCard aria-hidden='true' />
                  <CardNumberElement className='payment-card-number-element' options={cardElementOptions} />
                  <div className='payment-card-brands' aria-hidden='true'>
                    <i>VISA</i>
                    <i>MC</i>
                    <i>AMEX</i>
                    <i>DISC</i>
                  </div>
                </div>
              </label>

              <div className='payment-field-grid'>
                <label>
                  <span>Expiry Date</span>
                  <div className='payment-expiry-input'>
                    <CardExpiryElement className='payment-card-expiry-element' options={cardElementOptions} />
                  </div>
                </label>
                <label>
                  <span>CVC</span>
                  <div className='payment-cvc-input'>
                    <CardCvcElement className='payment-card-cvc-element' options={cardElementOptions} />
                    <CircleHelp aria-hidden='true' />
                  </div>
                </label>
              </div>

              <label className={`payment-field-full ${fieldErrors.postalCode ? 'has-error' : ''}`}>
                <span>Zip / Postal Code</span>
                <input
                  autoComplete='postal-code'
                  {...register('postalCode', {
                    required: 'Zip or postal code is required',
                    minLength: {
                      value: 3,
                      message: 'Enter a valid zip or postal code',
                    },
                  })}
                />
                {fieldErrors.postalCode?.message && (
                  <small className='payment-field-error' role='alert'>
                    {fieldErrors.postalCode.message}
                  </small>
                )}
              </label>

              <button className='payment-submit' type='submit' disabled={isSubmitting || !stripe}>
                {isSubmitting ? (
                  <LoaderCircle className='payment-submit-spinner' aria-hidden='true' />
                ) : (
                  <Lock aria-hidden='true' />
                )}
                {isSubmitting ? 'Processing...' : 'Subscribe to Pro'}
              </button>

              {paymentError && (
                <p className='payment-submit-error' role='alert'>
                  {paymentError}
                </p>
              )}

              <p className='payment-after-note'>
                {planPrice.note}
                <br />
                You can cancel anytime from your account settings.
              </p>
            </section>
          </form>

          <p className='payment-terms'>
            By subscribing, you agree to our <Link to='/terms'>Terms of Service</Link> and{' '}
            <Link to='/privacy'>Privacy Policy</Link>.
          </p>
        </section>

        <aside className='payment-sidebar'>
          <section className='payment-summary-card'>
            <h2>Order Summary</h2>
            <div className='payment-plan-icon'>
              <Crown aria-hidden='true' />
            </div>
            <strong>Pro Plan</strong>
            <span>{planPrice.label} Subscription</span>

            <div className='payment-price-lines'>
              <p>
                <span>Due today</span>
                <strong>{planPrice.price}</strong>
              </p>
              <p>
                <span>{planPrice.renewal}</span>
                <em>{planPrice.summary}</em>
              </p>
            </div>

            <ul className='payment-feature-list'>
              {includedFeatures.map((feature) => (
                <li key={feature}>
                  <Check aria-hidden='true' />
                  {feature}
                </li>
              ))}
            </ul>
          </section>

          <section className='payment-side-card'>
            <h2>
              <Lock aria-hidden='true' />
              Secure Checkout
            </h2>
            <p>
              <Sparkle aria-hidden='true' />
              Your payment information is encrypted and secure.
            </p>
            <div className='payment-security-row'>
              <span className='payment-stripe'>stripe</span>
              <span>
                <ShieldCheck aria-hidden='true' />
                256-bit SSL
              </span>
            </div>
          </section>

          <section className='payment-side-card'>
            <h2>Love RiverIQ?</h2>
            <blockquote>“This tool has completely transformed the way I review my game.”</blockquote>
            <p>— Verified User</p>
            <div className='payment-stars' aria-label='Five star rating'>
              {Array.from({ length: 5 }).map((_, index) => (
                <Star aria-hidden='true' fill='currentColor' key={index} />
              ))}
            </div>
          </section>
        </aside>
      </div>

      {showSuccessModal && (
        <div className='payment-success-overlay' role='presentation'>
          <section
            className='payment-success-modal'
            role='dialog'
            aria-modal='true'
            aria-labelledby='payment-success-title'
          >
            <div className='payment-success-icon'>
              <Check aria-hidden='true' />
            </div>
            <h2 id='payment-success-title'>Subscription activated</h2>
            <p>Your RiverIQ Pro access is ready. You can now use every Pro feature across your dashboard.</p>
            <div className='payment-success-actions'>
              <Link className='payment-success-primary' to='/dashboard'>
                Go to Dashboard
              </Link>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default PaymentPage;
