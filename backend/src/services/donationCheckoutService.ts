import Stripe from 'stripe';

import env from '../config/env';
import { InternalServerError, ValidationError } from '../errors/CustomError';

export const DONATION_AMOUNTS = [100, 500, 1000, 5000, 10000] as const;
export type DonationAmount = (typeof DONATION_AMOUNTS)[number];

const priceIdMap: Record<DonationAmount, string> = {
  100: env.STRIPE_ONE_SHORT_DONATION_JPY_100,
  500: env.STRIPE_ONE_SHORT_DONATION_JPY_500,
  1000: env.STRIPE_ONE_SHORT_DONATION_JPY_1000,
  5000: env.STRIPE_ONE_SHORT_DONATION_JPY_5000,
  10000: env.STRIPE_ONE_SHORT_DONATION_JPY_10000,
};

const stripeClient = new Stripe(env.STRIPE_SECRET_KEY);

type StripeCheckoutSessionResponse = Stripe.Response<Stripe.Checkout.Session>;

type CreateCheckoutSession = (
  params?: Stripe.Checkout.SessionCreateParams,
  options?: Stripe.RequestOptions
) => Promise<StripeCheckoutSessionResponse>;

const createStripeCheckoutSession: CreateCheckoutSession = (params, options) =>
  stripeClient.checkout.sessions.create(params, options);

interface CreateDonationCheckoutSessionOptions {
  amount: number;
  createCheckoutSession?: CreateCheckoutSession;
}

export const createDonationCheckoutSession = async ({
  amount,
  createCheckoutSession = createStripeCheckoutSession,
}: CreateDonationCheckoutSessionOptions): Promise<Stripe.Checkout.Session> => {
  if (!DONATION_AMOUNTS.includes(amount as DonationAmount)) {
    throw new ValidationError('サポートされていない寄付金額が指定されました。');
  }

  const donationAmount = amount as DonationAmount;
  const priceId = priceIdMap[donationAmount];

  try {
    const sessionResponse = await createCheckoutSession({
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: env.STRIPE_SUCCESS_URL,
      cancel_url: env.STRIPE_CANCEL_URL,
      submit_type: 'donate',
      locale: 'ja',
      metadata: {
        donationAmountYen: donationAmount.toString(),
      },
    });

    return sessionResponse;
  } catch (error) {
    console.error('Stripe checkout session creation failed', error);
    throw new InternalServerError(
      'Stripe Checkout セッションの作成に失敗しました。'
    );
  }
};
