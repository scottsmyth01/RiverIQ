import { BadgeCheck, Spade } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import './SubscriptionPaymentPage.css';

const SubscriptionConfirmationPage = () => {
  const { state } = useLocation();

  return (
    <main className='subscription-checkout confirmation-page'>
      <header className='checkout-header'>
        <Link className='checkout-brand' to='/dashboard'>
          <Spade aria-hidden='true' />
          <span>
            River<strong>IQ</strong>
          </span>
        </Link>
      </header>

      <section className='confirmation-card'>
        <ol className='checkout-steps checkout-steps--confirmation' aria-label='Checkout progress'>
          <li className='complete'>
            <span>✓</span>
            <strong>Payment</strong>
          </li>
          <li className='active'>
            <span>2</span>
            <strong>Confirmation</strong>
          </li>
        </ol>

        <div className='confirmation-icon'>
          <BadgeCheck aria-hidden='true' />
        </div>
        <span className='confirmation-label'>Payment confirmed</span>
        <h1>Your Pro trial is ready.</h1>
        <p>
          Thanks{state?.customerName ? `, ${state.customerName}` : ''}! Your 7-day free trial has started
          {state?.email ? ` and a confirmation was sent to ${state.email}` : ''}.
        </p>

        <div className='confirmation-details'>
          <span>
            Charged today <strong>$0.00</strong>
          </span>
          <span>
            Next payment <strong>$19.99 CAD after 7 days</strong>
          </span>
        </div>

        <Link className='checkout-submit confirmation-action' to='/dashboard'>
          Go to Dashboard
        </Link>
      </section>
    </main>
  );
};

export default SubscriptionConfirmationPage;
