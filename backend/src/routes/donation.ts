import express, { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

import stripeClient from '../config/stripe';
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

/** 寄付用のStripe Checkoutセッションを作成する */
router.post(
  '/checkout-session',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { amount } = req.body as { amount?: number | string };
      const parsedAmount: number | undefined =
        typeof amount === 'string' ? Number.parseInt(amount, 10) : amount;

      // 金額の妥当性を検証する
      if (
        typeof parsedAmount !== 'number' ||
        !Number.isInteger(parsedAmount) ||
        !Object.prototype.hasOwnProperty.call(
          DONATION_PRICE_ID_MAP,
          String(parsedAmount)
        )
      ) {
        throw new ValidationError('不正な寄付金額が選択されました。');
      }

      const donationAmount: number = parsedAmount;
      const sessionIdForIdempotency: string =
        (req as Request & { sessionID?: string }).sessionID ?? 'anon';
      const idempotencyKey: string = `${sessionIdForIdempotency}:donation:${donationAmount}`;

      const session = await stripeClient.checkout.sessions.create(
        {
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
        },
        { idempotencyKey }
      );

      if (!session.url) {
        throw new InternalServerError(
          'Stripe Checkout セッションURLの取得に失敗しました。'
        );
      }

      res
        .status(StatusCodes.CREATED)
        .json({ sessionId: session.id, url: session.url });
    } catch (error) {
      if (!(error instanceof ValidationError)) {
        console.error('[donations] checkout-session failed', error);
      }
      next(error);
    }
  }
);

export default router;
