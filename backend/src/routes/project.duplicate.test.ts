import express from 'express';
import request from 'supertest';
import { describe, it, expect, vi } from 'vitest';

import { PERMISSION_ACTIONS } from '../const';
import { checkProjectWritePermission } from '../middlewares/permissions';

vi.mock('../helpers/roleHelper', () => ({
  hasPermission: vi.fn(),
}));

import { hasPermission } from '../helpers/roleHelper';

describe('POST /api/projects/:projectId/duplicate', () => {
  it('denies duplication for read-only users', async () => {
    (hasPermission as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      async (_userId, _resource, action) => action === PERMISSION_ACTIONS.READ
    );

    const app = express();
    app.use(express.json());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.use((req: any, _res, next) => {
      req.isAuthenticated = () => true;
      req.user = { id: 'user1' };
      next();
    });

    app.post(
      '/api/projects/:projectId/duplicate',
      checkProjectWritePermission,
      (_req, res) => {
        res.json({ ok: true });
      }
    );

    const res = await request(app).post('/api/projects/proj1/duplicate');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      message: 'projectへのwrite権限がありません',
    });
  });
});
