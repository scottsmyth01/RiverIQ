import { describe, expect, jest, test, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import '../../test/setupDb.js';

const mockStripe = {
  customers: {
    create: jest.fn(),
  },
  subscriptions: {
    create: jest.fn(),
    retrieve: jest.fn(),
    list: jest.fn(),
    cancel: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

jest.unstable_mockModule('../../config/stripe.js', () => ({
  default: mockStripe,
}));

const { default: app } = await import('../../app.js');
const { default: User } = await import('../../models/User.js');

const originalStripePriceId = process.env.STRIPE_PRICE_ID;
const originalStripeYearlyPriceId = process.env.STRIPE_YEARLY_PRICE_ID;
const originalStripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const validUser = {
  username: 'payhero',
  email: 'payhero@riveriq.test',
  password: 'Password123',
  passwordConfirm: 'Password123',
};

async function createLoggedInAgent(overrides = {}) {
  const agent = request.agent(app);

  await agent
    .post('/api/auth/register')
    .send({
      ...validUser,
      username: overrides.username || validUser.username,
      email: overrides.email || validUser.email,
    })
    .expect(201);

  return agent;
}

beforeEach(() => {
  process.env.STRIPE_PRICE_ID = 'price_riveriq_pro_test';
  process.env.STRIPE_YEARLY_PRICE_ID = 'price_riveriq_pro_yearly_test';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_riveriq_test';
  jest.clearAllMocks();
});

afterAll(() => {
  if (originalStripePriceId === undefined) {
    delete process.env.STRIPE_PRICE_ID;
  } else {
    process.env.STRIPE_PRICE_ID = originalStripePriceId;
  }

  if (originalStripeYearlyPriceId === undefined) {
    delete process.env.STRIPE_YEARLY_PRICE_ID;
  } else {
    process.env.STRIPE_YEARLY_PRICE_ID = originalStripeYearlyPriceId;
  }

  if (originalStripeWebhookSecret === undefined) {
    delete process.env.STRIPE_WEBHOOK_SECRET;
  } else {
    process.env.STRIPE_WEBHOOK_SECRET = originalStripeWebhookSecret;
  }
});

describe('payment API integration', () => {
  test('protects payment routes from logged-out users', async () => {
    await request(app).post('/api/payments/subscribe').expect(401);
    await request(app).post('/api/payments/subscription/confirm').send({ subscriptionId: 'sub_test' }).expect(401);
    await request(app).post('/api/payments/subscription/cancel').expect(401);
  });

  test('creates a Stripe customer and subscription for a new subscriber', async () => {
    const agent = await createLoggedInAgent();

    mockStripe.customers.create.mockResolvedValue({ id: 'cus_test_123' });
    mockStripe.subscriptions.create.mockResolvedValue({
      id: 'sub_test_123',
      latest_invoice: {
        confirmation_secret: {
          client_secret: 'pi_secret_test',
        },
      },
    });

    const response = await agent
      .post('/api/payments/subscribe')
      .send({ fullName: 'Pay Hero' })
      .expect(200);

    expect(response.body).toEqual({
      subscriptionId: 'sub_test_123',
      clientSecret: 'pi_secret_test',
      billingInterval: 'monthly',
    });
    expect(mockStripe.customers.create).toHaveBeenCalledWith({
      email: validUser.email,
      name: 'Pay Hero',
    });
    expect(mockStripe.subscriptions.create).toHaveBeenCalledWith({
      customer: 'cus_test_123',
      items: [{ price: 'price_riveriq_pro_test' }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.confirmation_secret'],
    });

    const savedUser = await User.findOne({ email: validUser.email });
    expect(savedUser.stripeCustomerId).toBe('cus_test_123');
  });

  test('creates a yearly Stripe subscription when yearly billing is selected', async () => {
    const agent = await createLoggedInAgent();

    mockStripe.customers.create.mockResolvedValue({ id: 'cus_yearly_123' });
    mockStripe.subscriptions.create.mockResolvedValue({
      id: 'sub_yearly_123',
      latest_invoice: {
        confirmation_secret: {
          client_secret: 'pi_yearly_secret',
        },
      },
    });

    const response = await agent
      .post('/api/payments/subscribe')
      .send({ fullName: 'Pay Hero', billingInterval: 'yearly' })
      .expect(200);

    expect(response.body).toEqual({
      subscriptionId: 'sub_yearly_123',
      clientSecret: 'pi_yearly_secret',
      billingInterval: 'yearly',
    });
    expect(mockStripe.subscriptions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_yearly_123',
        items: [{ price: 'price_riveriq_pro_yearly_test' }],
      }),
    );
  });

  test('reuses an existing Stripe customer when creating a subscription', async () => {
    const agent = await createLoggedInAgent();
    await User.updateOne({ email: validUser.email }, { stripeCustomerId: 'cus_existing_123' });

    mockStripe.subscriptions.create.mockResolvedValue({
      id: 'sub_existing_123',
      latest_invoice: {
        confirmation_secret: {
          client_secret: 'pi_existing_secret',
        },
      },
    });

    await agent.post('/api/payments/subscribe').send({ fullName: 'Ignored Name' }).expect(200);

    expect(mockStripe.customers.create).not.toHaveBeenCalled();
    expect(mockStripe.subscriptions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_existing_123',
      }),
    );
  });

  test('returns helpful errors when subscription setup is incomplete', async () => {
    const agent = await createLoggedInAgent();

    delete process.env.STRIPE_PRICE_ID;
    const missingPriceResponse = await agent.post('/api/payments/subscribe').send({}).expect(500);
    expect(missingPriceResponse.body.message).toBe('Missing STRIPE_PRICE_ID');
    expect(mockStripe.customers.create).not.toHaveBeenCalled();
    expect(mockStripe.subscriptions.create).not.toHaveBeenCalled();

    process.env.STRIPE_PRICE_ID = 'price_riveriq_pro_test';
    delete process.env.STRIPE_YEARLY_PRICE_ID;
    const missingYearlyPriceResponse = await agent
      .post('/api/payments/subscribe')
      .send({ billingInterval: 'yearly' })
      .expect(500);
    expect(missingYearlyPriceResponse.body.message).toBe('Missing STRIPE_YEARLY_PRICE_ID');
    expect(mockStripe.subscriptions.create).not.toHaveBeenCalled();

    process.env.STRIPE_YEARLY_PRICE_ID = 'price_riveriq_pro_yearly_test';
    const invalidBillingResponse = await agent
      .post('/api/payments/subscribe')
      .send({ billingInterval: 'weekly' })
      .expect(400);
    expect(invalidBillingResponse.body.message).toBe('Invalid billingInterval');
    expect(mockStripe.subscriptions.create).not.toHaveBeenCalled();

    mockStripe.customers.create.mockResolvedValue({ id: 'cus_no_secret' });
    mockStripe.subscriptions.create.mockResolvedValue({
      id: 'sub_no_secret',
      latest_invoice: {},
    });

    const noSecretResponse = await agent.post('/api/payments/subscribe').send({}).expect(500);
    expect(noSecretResponse.body.message).toMatch(/client secret/i);
  });

  test('confirms an active Stripe subscription and upgrades the user to pro', async () => {
    const agent = await createLoggedInAgent();
    await User.updateOne({ email: validUser.email }, { stripeCustomerId: 'cus_confirm_123' });

    mockStripe.subscriptions.retrieve.mockResolvedValue({
      id: 'sub_confirm_123',
      customer: 'cus_confirm_123',
      status: 'active',
    });

    const response = await agent
      .post('/api/payments/subscription/confirm')
      .send({ subscriptionId: 'sub_confirm_123' })
      .expect(200);

    expect(response.body.subscription).toBe('pro');
    expect(response.body.user.subscription).toBe('pro');

    const savedUser = await User.findOne({ email: validUser.email });
    expect(savedUser.subscription).toBe('pro');
    expect(savedUser.stripeSubscriptionId).toBe('sub_confirm_123');
  });

  test('rejects invalid or mismatched subscription confirmation', async () => {
    const agent = await createLoggedInAgent();
    await User.updateOne({ email: validUser.email }, { stripeCustomerId: 'cus_owner_123' });

    const missingIdResponse = await agent.post('/api/payments/subscription/confirm').send({}).expect(400);
    expect(missingIdResponse.body.message).toBe('Missing subscriptionId');

    mockStripe.subscriptions.retrieve.mockResolvedValueOnce({
      id: 'sub_other_123',
      customer: 'cus_other_123',
      status: 'active',
    });
    const wrongCustomerResponse = await agent
      .post('/api/payments/subscription/confirm')
      .send({ subscriptionId: 'sub_other_123' })
      .expect(403);
    expect(wrongCustomerResponse.body.message).toMatch(/does not belong/i);

    mockStripe.subscriptions.retrieve.mockResolvedValueOnce({
      id: 'sub_incomplete_123',
      customer: 'cus_owner_123',
      status: 'incomplete',
    });
    const incompleteResponse = await agent
      .post('/api/payments/subscription/confirm')
      .send({ subscriptionId: 'sub_incomplete_123' })
      .expect(400);
    expect(incompleteResponse.body.message).toBe('Subscription is incomplete');
  });

  test('cancels the current Stripe subscription and downgrades the user to free', async () => {
    const agent = await createLoggedInAgent();
    await User.updateOne(
      { email: validUser.email },
      {
        subscription: 'pro',
        stripeCustomerId: 'cus_cancel_123',
        stripeSubscriptionId: 'sub_cancel_123',
      },
    );

    mockStripe.subscriptions.retrieve.mockResolvedValue({
      id: 'sub_cancel_123',
      customer: 'cus_cancel_123',
      status: 'active',
    });
    mockStripe.subscriptions.cancel.mockResolvedValue({
      id: 'sub_cancel_123',
      status: 'canceled',
    });

    const response = await agent.post('/api/payments/subscription/cancel').expect(200);

    expect(response.body).toMatchObject({
      message: 'Subscription canceled',
      stripeSubscriptionId: 'sub_cancel_123',
      stripeSubscriptionStatus: 'canceled',
      subscription: 'free',
    });
    expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith('sub_cancel_123');

    const savedUser = await User.findOne({ email: validUser.email });
    expect(savedUser.subscription).toBe('free');
    expect(savedUser.stripeSubscriptionId).toBeUndefined();
  });

  test('downgrades locally when no active Stripe subscription exists', async () => {
    const agent = await createLoggedInAgent();
    await User.updateOne(
      { email: validUser.email },
      {
        subscription: 'pro',
        stripeCustomerId: 'cus_none_123',
      },
    );

    mockStripe.subscriptions.list.mockResolvedValue({ data: [] });

    const response = await agent.post('/api/payments/subscription/cancel').expect(200);

    expect(response.body).toMatchObject({
      message: 'No active subscription found',
      subscription: 'free',
    });
    expect(mockStripe.subscriptions.cancel).not.toHaveBeenCalled();

    const savedUser = await User.findOne({ email: validUser.email });
    expect(savedUser.subscription).toBe('free');
  });

  test('syncs active subscription status from a signed Stripe webhook', async () => {
    await User.create({
      username: 'webhookhero',
      email: 'webhookhero@riveriq.test',
      password: 'Password123',
      isEmailVerified: true,
      stripeCustomerId: 'cus_webhook_123',
    });

    mockStripe.webhooks.constructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_webhook_123',
          customer: 'cus_webhook_123',
          status: 'active',
        },
      },
    });

    const response = await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 'signed_test_payload')
      .set('content-type', 'application/json')
      .send(Buffer.from(JSON.stringify({ id: 'evt_webhook_123' })))
      .expect(200);

    expect(response.body).toEqual({ received: true });
    expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
      expect.any(Buffer),
      'signed_test_payload',
      'whsec_riveriq_test',
    );

    const savedUser = await User.findOne({ email: 'webhookhero@riveriq.test' });
    expect(savedUser.subscription).toBe('pro');
    expect(savedUser.stripeSubscriptionId).toBe('sub_webhook_123');
  });

  test('downgrades subscription status from a Stripe deleted webhook', async () => {
    await User.create({
      username: 'deletedsubhero',
      email: 'deletedsubhero@riveriq.test',
      password: 'Password123',
      isEmailVerified: true,
      subscription: 'pro',
      stripeCustomerId: 'cus_deleted_123',
      stripeSubscriptionId: 'sub_deleted_123',
    });

    mockStripe.webhooks.constructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_deleted_123',
          customer: 'cus_deleted_123',
          status: 'canceled',
        },
      },
    });

    await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 'signed_delete_payload')
      .set('content-type', 'application/json')
      .send(Buffer.from(JSON.stringify({ id: 'evt_deleted_123' })))
      .expect(200);

    const savedUser = await User.findOne({ email: 'deletedsubhero@riveriq.test' });
    expect(savedUser.subscription).toBe('free');
    expect(savedUser.stripeSubscriptionId).toBeUndefined();
  });

  test('rejects Stripe webhooks with invalid signatures', async () => {
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });

    const response = await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 'bad_signature')
      .set('content-type', 'application/json')
      .send(Buffer.from(JSON.stringify({ id: 'evt_bad_signature' })))
      .expect(400);

    expect(response.body.message).toMatch(/signature verification failed/i);
  });

  test('returns a setup error when the Stripe webhook secret is missing', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const response = await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 'signed_test_payload')
      .set('content-type', 'application/json')
      .send(Buffer.from(JSON.stringify({ id: 'evt_missing_secret' })))
      .expect(500);

    expect(response.body.message).toBe('Missing STRIPE_WEBHOOK_SECRET');
    expect(mockStripe.webhooks.constructEvent).not.toHaveBeenCalled();
  });
});
