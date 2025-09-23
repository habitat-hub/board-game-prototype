import Stripe from 'stripe';

import env from './env';

const DEFAULT_STRIPE_API_VERSION: Stripe.LatestApiVersion = '2025-08-27.basil';
const DEFAULT_APP_INFO: Stripe.StripeConfig['appInfo'] = {
  name: 'Board Game Prototype Backend',
};

const resolveApiVersion = (): Stripe.StripeConfig['apiVersion'] => {
  const version = env.STRIPE_API_VERSION?.trim();

  if (version) {
    return version as Stripe.StripeConfig['apiVersion'];
  }

  return DEFAULT_STRIPE_API_VERSION;
};

const resolveAppInfo = (): Stripe.StripeConfig['appInfo'] => {
  const name = env.STRIPE_APP_NAME?.trim();

  if (!name) {
    return DEFAULT_APP_INFO;
  }

  return { name };
};

const stripeClient: Stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: resolveApiVersion(),
  appInfo: resolveAppInfo(),
});

export default stripeClient;
