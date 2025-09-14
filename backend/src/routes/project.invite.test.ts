import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock authentication to always attach a user
vi.mock('../middlewares/auth', () => ({
  ensureAuthenticated: (req: any, _res: any, next: any) => {
    req.user = { id: 'user1' };
    next();
  },
}));

// Spyable admin middleware to control permission outcome
const adminMiddleware = vi.hoisted(() =>
  vi.fn((req: any, _res: any, next: any) => next())
);
vi.mock('../middlewares/permissions', () => ({
  checkProjectReadPermission: (req: any, _res: any, next: any) => next(),
  checkProjectWritePermission: (req: any, _res: any, next: any) => next(),
  checkProjectAdminRole: adminMiddleware,
}));

// Helper mock
vi.mock('../helpers/roleHelper', () => ({
  assignRole: vi.fn().mockResolvedValue(undefined),
}));

import RoleModel from '../models/Role';
import UserModel from '../models/User';
import ProjectModel from '../models/Project';
import UserRoleModel from '../models/UserRole';

// Import router after mocks
import projectRouter from './project';

const app = express();
app.use(express.json());
app.use('/api/projects', projectRouter);

describe('project member management routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    adminMiddleware.mockImplementation((req: any, _res: any, next: any) =>
      next()
    );
    adminMiddleware.mockClear();
    vi.spyOn(RoleModel, 'findOne').mockResolvedValue({ id: 'role1' } as any);
    vi.spyOn(UserModel, 'findAll').mockResolvedValue([{ id: 'guest1' }] as any);
    vi.spyOn(ProjectModel, 'findByPk').mockResolvedValue({
      id: 'proj1',
      userId: 'owner1',
    } as any);
    vi.spyOn(UserRoleModel, 'destroy').mockResolvedValue(1 as any);
  });

  it('allows admins to invite members', async () => {
    const res = await request(app)
      .post('/api/projects/proj1/invite')
      .send({ guestIds: ['guest1'], roleType: 'editor' });
    expect(res.status).toBe(200);
  });

  it('prevents non-admins from inviting members', async () => {
    adminMiddleware.mockImplementationOnce((req: any, res: any) =>
      res.status(403).json({ message: 'Adminロールが必要です' })
    );
    const res = await request(app)
      .post('/api/projects/proj1/invite')
      .send({ guestIds: ['guest1'] });
    expect(res.status).toBe(403);
  });

  it('allows admins to remove members', async () => {
    const res = await request(app).delete('/api/projects/proj1/invite/guest1');
    expect(res.status).toBe(200);
  });

  it('prevents non-admins from removing members', async () => {
    adminMiddleware.mockImplementationOnce((req: any, res: any) =>
      res.status(403).json({ message: 'Adminロールが必要です' })
    );
    const res = await request(app).delete('/api/projects/proj1/invite/guest1');
    expect(res.status).toBe(403);
  });
});
