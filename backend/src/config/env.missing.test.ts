import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('env config missing variables', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = 'postgres://test';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.FRONTEND_DOMAIN = 'localhost';
    process.env.SESSION_SECRET = 'secret';
    process.env.GOOGLE_CLIENT_ID = 'id';
    process.env.GOOGLE_CLIENT_SECRET = 'secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost';
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'key';
    process.env.AWS_SECRET_ACCESS_KEY = 'secret';
    process.env.AWS_S3_BUCKET_NAME = 'bucket';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_DONATION_SUCCESS_URL =
      'http://localhost:3000/donations/success';
    process.env.STRIPE_DONATION_CANCEL_URL =
      'http://localhost:3000/donations/cancel';
    process.env.STRIPE_ONE_SHORT_DONATION_JPY_100 = 'price_100';
    process.env.STRIPE_ONE_SHORT_DONATION_JPY_500 = 'price_500';
    process.env.STRIPE_ONE_SHORT_DONATION_JPY_1000 = 'price_1000';
    process.env.STRIPE_ONE_SHORT_DONATION_JPY_5000 = 'price_5000';
    process.env.STRIPE_ONE_SHORT_DONATION_JPY_10000 = 'price_10000';
  });

  it('throws when a required env var is missing', async () => {
    delete process.env.SESSION_SECRET;
    await expect(import('./env')).rejects.toThrow(/SESSION_SECRET/);
  });
});
