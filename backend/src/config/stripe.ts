import Stripe from 'stripe';

import env from './env';

const stripeClient = new Stripe(env.STRIPE_SECRET_KEY);

export default stripeClient;
