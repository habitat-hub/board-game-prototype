import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./config/swagger', () => ({ setupSwagger: vi.fn() }));
vi.mock('./config/socket', () => ({ setupSocket: vi.fn() }));
vi.mock('./config/database', () => ({ connectDatabase: vi.fn() }));
vi.mock('./config/session', () => ({ setupSession: vi.fn() }));

import { app } from './server';

describe('GET /health', () => {
  it('returns 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });
});
