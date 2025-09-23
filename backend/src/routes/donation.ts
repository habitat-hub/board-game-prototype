import express, { Request, Response, NextFunction } from 'express';

import stripe from '../config/stripe';
import env from '../config/env';
import { InternalServerError, ValidationError } from '../errors/CustomError';

const router = express.Router();

const DONATION_PRICE_ID_MAP: Record<number, string> = {
  100: env.STRIPE_ONE_SHORT_DONATION_JPY_100,
  500: env.STRIPE_ONE_SHORT_DONATION_JPY_500,
  1000: env.STRIPE_ONE_SHORT_DONATION_JPY_1000,
  5000: env.STRIPE_ONE_SHORT_DONATION_JPY_5000,
  10000: env.STRIPE_ONE_SHORT_DONATION_JPY_10000,
};

router.get('/options', (_req: Request, res: Response) => {
  const options = Object.entries(DONATION_PRICE_ID_MAP).map(
    ([amount, priceId]) => ({
      amount: Number.parseInt(amount, 10),
      priceId,
    })
  );

  res.json({ currency: 'jpy', options });
});

router.post(
  '/checkout-session',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { amount } = req.body as { amount?: number | string };
      const parsedAmount =
        typeof amount === 'string' ? Number.parseInt(amount, 10) : amount;

      if (
        typeof parsedAmount !== 'number' ||
        !Number.isInteger(parsedAmount) ||
        !(parsedAmount in DONATION_PRICE_ID_MAP)
      ) {
        throw new ValidationError('不正な寄付金額が選択されました。');
      }

      const donationAmount = parsedAmount;

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            price: DONATION_PRICE_ID_MAP[donationAmount],
            quantity: 1,
          },
        ],
        success_url: env.STRIPE_DONATION_SUCCESS_URL,
        cancel_url: env.STRIPE_DONATION_CANCEL_URL,
        metadata: {
          donation_amount_jpy: String(donationAmount),
        },
      });

      if (!session.url) {
        throw new InternalServerError(
          'Stripe Checkout session URL was not returned.'
        );
      }

      res.status(201).json({ sessionId: session.id, url: session.url });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
