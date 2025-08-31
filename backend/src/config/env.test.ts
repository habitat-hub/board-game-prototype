import { describe, it, expect, beforeEach } from 'vitest';

describe('env config', () => {
  beforeEach(() => {
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
  });

  it('should load and validate environment variables', async () => {
    const env = (await import('./env')).default;
    expect(env.NODE_ENV).toBe('development');
    expect(env.DATABASE_URL).toBe('postgres://test');
  });
});
