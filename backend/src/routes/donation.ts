import express, { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

import stripeClient from '../config/stripe';
import env from '../config/env';
import { InternalServerError, ValidationError } from '../errors/CustomError';

const router = express.Router();

/** フロントエンドの寄付完了ページURL */
const DONATION_SUCCESS_URL: string = new URL(
  '/donate/success',
  env.FRONTEND_URL
).toString();
/** フロントエンドの寄付キャンセルページURL */
const DONATION_CANCEL_URL: string = new URL(
  '/donate',
  env.FRONTEND_URL
).toString();

/**
 * @swagger
 * tags:
 *   name: Donations
 *   description: 寄付オプションやチェックアウトセッションを提供するAPI
 */

const DONATION_PRICE_ID_MAP: Record<number, string> = {
  100: env.STRIPE_ONE_SHORT_DONATION_JPY_100_PRICE_ID,
  500: env.STRIPE_ONE_SHORT_DONATION_JPY_500_PRICE_ID,
  1000: env.STRIPE_ONE_SHORT_DONATION_JPY_1000_PRICE_ID,
  5000: env.STRIPE_ONE_SHORT_DONATION_JPY_5000_PRICE_ID,
  10000: env.STRIPE_ONE_SHORT_DONATION_JPY_10000_PRICE_ID,
};

/**
 * @swagger
 * /api/donations/options:
 *   get:
 *     tags: [Donations]
 *     summary: 寄付オプション一覧の取得
 *     description: Stripeで利用可能な寄付金額と対応するPrice IDを取得します。
 *     responses:
 *       '200':
 *         description: 寄付オプションの一覧
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currency:
 *                   type: string
 *                   description: 寄付に使用する通貨
 *                   example: jpy
 *                 options:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       amount:
 *                         type: integer
 *                         description: 利用可能な寄付金額（JPY）
 *                         example: 500
 *                       priceId:
 *                         type: string
 *                         description: Stripe Price ID
 *                         example: price_test_jpy_500
 *       '500':
 *         description: 寄付オプションの取得に失敗しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500Response'
 */
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
/**
 * @swagger
 * /api/donations/checkout-session:
 *   post:
 *     tags: [Donations]
 *     summary: 寄付用Stripe Checkoutセッションの作成
 *     description: 選択された寄付金額でStripe Checkoutセッションを作成します。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: 寄付金額（JPY）
 *                 example: 500
 *     responses:
 *       '201':
 *         description: セッションの作成に成功しました
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                   description: Stripe CheckoutセッションID
 *                   example: cs_test_123
 *                 url:
 *                   type: string
 *                   format: uri
 *                   description: Stripe CheckoutセッションURL
 *                   example: https://checkout.stripe.com/test-session
 *       '400':
 *         description: 寄付金額のバリデーションエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400Response'
 *       '500':
 *         description: Stripeセッションの作成に失敗しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500Response'
 */
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
      const headerKey: string | undefined = req.get('Idempotency-Key')?.trim();
      const sessionKey: string | undefined = (
        req as Request & {
          sessionID?: string;
        }
      ).sessionID;
      const baseKey: string | undefined = headerKey || sessionKey;
      const idempotencyKey: string | undefined = baseKey
        ? `${baseKey}:donation:${donationAmount}`
        : undefined;

      const session = await stripeClient.checkout.sessions.create(
        {
          mode: 'payment',
          line_items: [
            {
              price: DONATION_PRICE_ID_MAP[donationAmount],
              quantity: 1,
            },
          ],
          success_url: DONATION_SUCCESS_URL,
          cancel_url: DONATION_CANCEL_URL,
          metadata: {
            donation_amount_jpy: String(donationAmount),
          },
        },
        idempotencyKey ? { idempotencyKey } : undefined
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
