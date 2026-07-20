import stripe from '../config/stripe.js';

function getUserPayload(user) {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    subscription: user.subscription,
    bankroll: user.bankroll,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    preferences: user.preferences,
    avatarUrl: user.avatarUrl,
    avatarKey: user.avatarKey,
  };
}

async function findCurrentSubscription(user) {
  if (user.stripeSubscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

      if (!['canceled', 'incomplete_expired'].includes(subscription.status)) {
        return subscription;
      }
    } catch (error) {
      if (error.statusCode !== 404) {
        throw error;
      }
    }
  }

  if (!user.stripeCustomerId) {
    return null;
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: 'all',
    limit: 10,
  });

  return (
    subscriptions.data.find((subscription) =>
      ['active', 'trialing', 'past_due', 'unpaid', 'incomplete'].includes(subscription.status),
    ) || null
  );
}

export const createSubscription = async (req, res) => {
  try {
    if (!process.env.STRIPE_PRICE_ID) {
      return res.status(500).json({ message: 'Missing STRIPE_PRICE_ID' });
    }

    let stripeCustomerId = req.user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.body.fullName || req.user.username,
      });

      stripeCustomerId = customer.id;
      req.user.stripeCustomerId = stripeCustomerId;
      await req.user.save();
    }

    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [
        {
          price: process.env.STRIPE_PRICE_ID,
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.confirmation_secret'],
    });

    const clientSecret = subscription.latest_invoice?.confirmation_secret?.client_secret;

    if (!clientSecret) {
      return res.status(500).json({
        message: 'Stripe did not return a subscription confirmation client secret',
      });
    }

    return res.json({
      subscriptionId: subscription.id,
      clientSecret,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const confirmSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ message: 'Missing subscriptionId' });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (subscription.customer !== req.user.stripeCustomerId) {
      return res.status(403).json({ message: 'Subscription does not belong to this user' });
    }

    if (!['active', 'trialing'].includes(subscription.status)) {
      return res.status(400).json({ message: `Subscription is ${subscription.status}` });
    }

    req.user.subscription = 'pro';
    req.user.stripeSubscriptionId = subscription.id;
    await req.user.save();

    return res.json({
      subscription: req.user.subscription,
      user: getUserPayload(req.user),
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const subscription = await findCurrentSubscription(req.user);

    if (!subscription) {
      req.user.subscription = 'free';
      req.user.stripeSubscriptionId = undefined;
      await req.user.save();

      return res.status(200).json({
        message: 'No active subscription found',
        subscription: req.user.subscription,
        user: getUserPayload(req.user),
      });
    }

    if (subscription.customer !== req.user.stripeCustomerId) {
      return res.status(403).json({ message: 'Subscription does not belong to this user' });
    }

    const canceledSubscription = await stripe.subscriptions.cancel(subscription.id);

    req.user.subscription = 'free';
    req.user.stripeSubscriptionId = undefined;
    await req.user.save();

    return res.status(200).json({
      message: 'Subscription canceled',
      stripeSubscriptionId: canceledSubscription.id,
      stripeSubscriptionStatus: canceledSubscription.status,
      subscription: req.user.subscription,
      user: getUserPayload(req.user),
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
