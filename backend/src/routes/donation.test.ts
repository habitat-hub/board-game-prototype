import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../config/generateArtifacts', () => ({
  generateArtifacts: vi.fn(),
}));
vi.mock('../config/socket', () => ({
  setupSocket: vi.fn(),
}));
vi.mock('../config/database', () => ({
  connectDatabase: vi.fn(),
}));
vi.mock('../config/session', () => ({
  setupSession: vi.fn(),
}));

const stripeMocks = vi.hoisted(() => ({
  createCheckoutSessionMock: vi.fn(),
}));

vi.mock('../config/stripe', () => ({
  default: {
    checkout: {
      sessions: {
        create: stripeMocks.createCheckoutSessionMock,
      },
    },
  },
}));

import { app } from '../server';

const { createCheckoutSessionMock } = stripeMocks;

describe('donation routes', () => {
  beforeEach(() => {
    createCheckoutSessionMock.mockReset();
  });

  it('returns fixed donation options', async () => {
    const res = await request(app).get('/api/donations/options');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      currency: 'jpy',
      options: [
        { amount: 100, priceId: 'price_test_jpy_100' },
        { amount: 500, priceId: 'price_test_jpy_500' },
        { amount: 1000, priceId: 'price_test_jpy_1000' },
        { amount: 5000, priceId: 'price_test_jpy_5000' },
        { amount: 10000, priceId: 'price_test_jpy_10000' },
      ],
    });
  });

  it('creates a Stripe Checkout session for a valid donation', async () => {
    createCheckoutSessionMock.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test-session',
    });

    const res = await request(app)
      .post('/api/donations/checkout-session')
      .send({ amount: 500 });

    expect(res.status).toBe(201);
    expect(createCheckoutSessionMock).toHaveBeenCalledWith({
      mode: 'payment',
      line_items: [
        {
          price: 'price_test_jpy_500',
          quantity: 1,
        },
      ],
      success_url: 'http://localhost:3000/donations/success',
      cancel_url: 'http://localhost:3000/donations/cancel',
      metadata: {
        donation_amount_jpy: '500',
      },
    });
    expect(res.body).toEqual({
      sessionId: 'cs_test_123',
      url: 'https://checkout.stripe.com/test-session',
    });
  });

  it('rejects an unsupported donation amount', async () => {
    const res = await request(app)
      .post('/api/donations/checkout-session')
      .send({ amount: 123 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'Invalid donation amount selected.',
    });
    expect(createCheckoutSessionMock).not.toHaveBeenCalled();
  });
});
