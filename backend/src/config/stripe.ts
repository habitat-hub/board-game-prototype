import Stripe from 'stripe';

import env from './env';

const DEFAULT_STRIPE_API_VERSION = '2024-06-20';
const DEFAULT_APP_INFO: Stripe.StripeConfig['appInfo'] = {
  name: 'Board Game Prototype Backend',
};

const resolveAppInfo = (): Stripe.StripeConfig['appInfo'] => {
  const name = env.STRIPE_APP_NAME?.trim();

  if (!name) {
    return DEFAULT_APP_INFO;
  }

  return { name };
};

const stripeClient: Stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: env.STRIPE_API_VERSION ?? DEFAULT_STRIPE_API_VERSION,
  appInfo: resolveAppInfo(),
});

export default stripeClient;
