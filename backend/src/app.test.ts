import request from 'supertest';
import { describe, it, expect } from 'vitest';

describe('GET /auth/user', () => {
  it('returns empty object when not authenticated', async () => {
    process.env.DATABASE_URL = 'postgres://localhost/test';
    const { default: app } = await import('./app');
    const res = await request(app).get('/auth/user');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  });
});
