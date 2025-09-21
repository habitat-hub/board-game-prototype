import Stripe from 'stripe';
import { describe, expect, it, vi } from 'vitest';

import env from '../config/env';
import {
  DONATION_AMOUNTS,
  createDonationCheckoutSession,
} from './donationCheckoutService';
import { InternalServerError, ValidationError } from '../errors/CustomError';

type CreateCheckoutSession = Stripe.Checkout.SessionsResource['create'];

describe('createDonationCheckoutSession', () => {
  it('creates a checkout session with the correct parameters', async () => {
    const mockSession = {
      id: 'cs_test_123',
      url: 'https://example.com/checkout',
      lastResponse: {
        headers: {},
        requestId: 'req_test_123',
        statusCode: 200,
      },
    } as unknown as Stripe.Response<Stripe.Checkout.Session>;

    const mockCreate = vi.fn(async () => mockSession);

    const amount = DONATION_AMOUNTS[1];

    const result = await createDonationCheckoutSession({
      amount,
      createCheckoutSession: mockCreate as unknown as CreateCheckoutSession,
    });

    expect(mockCreate).toHaveBeenCalledWith({
      mode: 'payment',
      line_items: [
        {
          price: env.STRIPE_ONE_SHORT_DONATION_JPY_500,
          quantity: 1,
        },
      ],
      success_url: env.STRIPE_SUCCESS_URL,
      cancel_url: env.STRIPE_CANCEL_URL,
      submit_type: 'donate',
      locale: 'ja',
      metadata: {
        donationAmountYen: amount.toString(),
      },
    });

    expect(result).toBe(mockSession);
  });

  it('throws a ValidationError when the amount is not supported', async () => {
    const mockCreate = vi.fn();

    await expect(
      createDonationCheckoutSession({
        amount: 42,
        createCheckoutSession: mockCreate as unknown as CreateCheckoutSession,
      })
    ).rejects.toBeInstanceOf(ValidationError);

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('throws an InternalServerError when Stripe returns an error', async () => {
    const mockCreate = vi
      .fn()
      .mockRejectedValue(new Error('Stripe API is unavailable'));

    await expect(
      createDonationCheckoutSession({
        amount: DONATION_AMOUNTS[0],
        createCheckoutSession: mockCreate as unknown as CreateCheckoutSession,
      })
    ).rejects.toBeInstanceOf(InternalServerError);
  });
});
