import express, { NextFunction, Request, Response } from 'express';

import { ValidationError } from '../errors/CustomError';
import { createDonationCheckoutSession } from '../services/donationCheckoutService';

const router = express.Router();

/**
 * @swagger
 * /api/donations/checkout-session:
 *   post:
 *     tags: [Donations]
 *     summary: Stripe Checkout セッションを作成する
 *     description: 指定した寄付金額に対する Stripe Checkout セッションを生成します。
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
 *                 enum: [100, 500, 1000, 5000, 10000]
 *                 description: 寄付金額（円）
 *     responses:
 *       '201':
 *         description: Stripe Checkout セッションを作成しました。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                   description: Stripe Checkout セッションID
 *                 sessionUrl:
 *                   type: string
 *                   nullable: true
 *                   description: Stripe Checkout のリダイレクト URL
 *       '400':
 *         description: 無効な寄付金額が指定されました。
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400Response'
 *       '500':
 *         description: Stripe Checkout セッションの生成時にエラーが発生しました。
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500Response'
 */
router.post(
  '/checkout-session',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { amount: rawAmount } = req.body ?? {};
      const parsedAmount =
        typeof rawAmount === 'string' ? Number(rawAmount) : rawAmount;

      if (typeof parsedAmount !== 'number' || Number.isNaN(parsedAmount)) {
        throw new ValidationError('寄付金額は数値で指定してください。');
      }

      if (!Number.isInteger(parsedAmount)) {
        throw new ValidationError('寄付金額は整数で指定してください。');
      }

      const session = await createDonationCheckoutSession({
        amount: parsedAmount,
      });

      res.status(201).json({
        sessionId: session.id,
        sessionUrl: session.url ?? null,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
