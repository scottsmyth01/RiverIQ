import stripe from '../config/stripe.js';

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
    await req.user.save();

    res.json({
      subscription: req.user.subscription,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
