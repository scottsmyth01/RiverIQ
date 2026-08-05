import { beforeEach, describe, expect, test, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentPage from '../PaymentPage';
import { renderWithRouter } from '../../test/testUtils.jsx';

const mocks = vi.hoisted(() => ({
  confirmCardPayment: vi.fn(),
  getElement: vi.fn(),
  setQueryData: vi.fn(),
}));

vi.mock('@stripe/react-stripe-js', () => ({
  CardCvcElement: ({ className }) => <div className={className} data-testid='card-cvc-element' />,
  CardExpiryElement: ({ className }) => <div className={className} data-testid='card-expiry-element' />,
  CardNumberElement: ({ className }) => <div className={className} data-testid='card-number-element' />,
  useElements: () => ({
    getElement: mocks.getElement,
  }),
  useStripe: () => ({
    confirmCardPayment: mocks.confirmCardPayment,
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    setQueryData: mocks.setQueryData,
  }),
}));

vi.mock('../../components/Navbar_dashboard/Navbar', () => ({
  default: () => <nav aria-label='Dashboard navigation' />,
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      username: 'hero',
      email: 'hero@riveriq.test',
      subscription: 'free',
    },
  }),
}));

function mockJsonResponse(body, ok = true) {
  return {
    ok,
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  };
}

describe('PaymentPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    mocks.confirmCardPayment.mockReset();
    mocks.getElement.mockReset();
    mocks.setQueryData.mockReset();
    mocks.getElement.mockReturnValue({ id: 'card-number-element' });
    mocks.confirmCardPayment.mockResolvedValue({
      paymentIntent: {
        id: 'pi_test_123',
      },
    });
  });

  test('starts a monthly subscription by default', async () => {
    global.fetch
      .mockResolvedValueOnce(
        mockJsonResponse({
          subscriptionId: 'sub_monthly_123',
          clientSecret: 'pi_monthly_secret',
          billingInterval: 'monthly',
        }),
      )
      .mockResolvedValueOnce(
        mockJsonResponse({
          user: {
            username: 'hero',
            email: 'hero@riveriq.test',
            subscription: 'pro',
          },
        }),
      );

    renderWithRouter(<PaymentPage />, { initialEntries: ['/subscription/payment'] });

    await userEvent.click(screen.getByRole('button', { name: /subscribe to pro/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    const subscribeRequest = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(subscribeRequest.billingInterval).toBe('monthly');
    expect(mocks.confirmCardPayment).toHaveBeenCalledWith(
      'pi_monthly_secret',
      expect.objectContaining({
        payment_method: expect.objectContaining({
          card: { id: 'card-number-element' },
        }),
      }),
    );
    expect(mocks.setQueryData).toHaveBeenCalledWith(['authUser'], {
      user: expect.objectContaining({ subscription: 'pro' }),
    });
    expect(await screen.findByRole('dialog', { name: /subscription activated/i })).toBeInTheDocument();
  });

  test('sends the yearly billing interval when yearly is selected', async () => {
    global.fetch
      .mockResolvedValueOnce(
        mockJsonResponse({
          subscriptionId: 'sub_yearly_123',
          clientSecret: 'pi_yearly_secret',
          billingInterval: 'yearly',
        }),
      )
      .mockResolvedValueOnce(mockJsonResponse({ user: { subscription: 'pro' } }));

    renderWithRouter(<PaymentPage />, { initialEntries: ['/subscription/payment'] });

    await userEvent.click(screen.getByRole('radio', { name: /yearly/i }));
    await userEvent.click(screen.getByRole('button', { name: /subscribe to pro/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    const subscribeRequest = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(subscribeRequest.billingInterval).toBe('yearly');
    expect(mocks.confirmCardPayment).toHaveBeenCalledWith('pi_yearly_secret', expect.any(Object));
  });
});
