import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { Op } from 'sequelize';
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type MockInstance,
} from 'vitest';

// Mock authentication to always attach a user
type AuthenticatedRequest = Request & { user?: { id: string } };

vi.mock('../middlewares/auth', () => ({
  ensureAuthenticated: (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ) => {
    req.user = { id: 'user1' };
    next();
  },
}));

// Spyable admin middleware to control permission outcome
const adminMiddleware = vi.hoisted(() => {
  const handler = (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    next();
  };

  return vi.fn(handler);
});
vi.mock('../middlewares/permissions', () => ({
  checkProjectReadPermission: (
    _req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ) => next(),
  checkProjectWritePermission: (
    _req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ) => next(),
  checkProjectAdminRole: adminMiddleware,
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
type UserRoleQuery = {
  attributes: string[];
  where: {
    resourceId: string;
    resourceType: string;
    roleId: number;
    userId: Record<typeof Op.in, string[]>;
  };
};

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const statusCode =
      err &&
      typeof err === 'object' &&
      'statusCode' in err &&
      typeof (err as { statusCode?: number }).statusCode === 'number'
        ? (err as { statusCode: number }).statusCode
        : err &&
            typeof err === 'object' &&
            'status' in err &&
            typeof (err as { status?: number }).status === 'number'
          ? (err as { status: number }).status
          : 500;
    const message =
      err instanceof Error ? err.message : 'Internal Server Error';
    res.status(statusCode).json({ message });
    void _next;
  }
);

describe('project member management routes', () => {
  let userFindAllSpy: MockInstance<typeof UserModel.findAll>;
  let userRoleFindAllSpy: MockInstance<typeof UserRoleModel.findAll>;
  let userRoleBulkCreateSpy: MockInstance<typeof UserRoleModel.bulkCreate>;

  beforeEach(() => {
    vi.restoreAllMocks();
    adminMiddleware.mockImplementation(
      (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
        next();
      }
    );
    adminMiddleware.mockClear();
    vi.spyOn(RoleModel, 'findOne').mockResolvedValue(
      RoleModel.build({ id: 2, name: 'editor', description: 'Editor role' })
    );
    userFindAllSpy = vi.spyOn(UserModel, 'findAll').mockResolvedValue([
      UserModel.build({
        id: 'guest1',
        googleId: 'guest1-google-id',
        username: 'Guest 1',
      }),
    ]);
    vi.spyOn(ProjectModel, 'findByPk').mockResolvedValue(
      ProjectModel.build({
        id: 'proj1',
        userId: 'owner1',
      })
    );
    userRoleFindAllSpy = vi
      .spyOn(UserRoleModel, 'findAll')
      .mockResolvedValue([] as unknown as UserRoleModel[]);
    userRoleBulkCreateSpy = vi
      .spyOn(UserRoleModel, 'bulkCreate')
      .mockResolvedValue([] as unknown as UserRoleModel[]);
    vi.spyOn(UserRoleModel, 'destroy').mockResolvedValue(1);
  });

  it('allows admins to invite members', async () => {
    const res = await request(app)
      .post('/api/projects/proj1/invite')
      .send({ guestIds: ['guest1'], roleType: 'editor' });
    expect(res.status).toBe(200);
    const findAllArgs = userRoleFindAllSpy.mock.calls[0]?.[0] as
      | UserRoleQuery
      | undefined;
    expect(findAllArgs).toBeDefined();
    if (!findAllArgs) {
      throw new Error('UserRoleModel.findAll was not called');
    }
    expect(findAllArgs.attributes).toEqual([
      'userId',
      'roleId',
      'resourceType',
      'resourceId',
    ]);
    expect(findAllArgs.where.resourceId).toBe('proj1');
    expect(findAllArgs.where.resourceType).toBe('project');
    expect(findAllArgs.where.roleId).toBe(2);
    expect(findAllArgs.where.userId[Op.in]).toEqual(['guest1']);
    expect(userRoleBulkCreateSpy).toHaveBeenCalledWith(
      [
        {
          resourceId: 'proj1',
          resourceType: 'project',
          roleId: 2,
          userId: 'guest1',
        },
      ],
      { ignoreDuplicates: true }
    );
  });

  it('skips existing assignments when inviting multiple members', async () => {
    userFindAllSpy.mockResolvedValueOnce([
      { id: 'guest1' },
      { id: 'guest2' },
    ] as unknown as UserModel[]);
    userRoleFindAllSpy.mockResolvedValueOnce([
      {
        userId: 'guest1',
        roleId: 2,
        resourceType: 'project',
        resourceId: 'proj1',
      } as unknown as UserRoleModel,
    ]);

    const res = await request(app)
      .post('/api/projects/proj1/invite')
      .send({ guestIds: ['guest1', 'guest1', 'guest2'], roleType: 'editor' });

    expect(res.status).toBe(200);
    expect(userRoleBulkCreateSpy).toHaveBeenCalledWith(
      [
        {
          resourceId: 'proj1',
          resourceType: 'project',
          roleId: 2,
          userId: 'guest2',
        },
      ],
      { ignoreDuplicates: true }
    );
  });

  it('does not insert when all guests already have the role', async () => {
    userRoleFindAllSpy.mockResolvedValueOnce([
      {
        userId: 'guest1',
        roleId: 2,
        resourceType: 'project',
        resourceId: 'proj1',
      } as unknown as UserRoleModel,
    ]);

    const res = await request(app)
      .post('/api/projects/proj1/invite')
      .send({ guestIds: ['guest1'], roleType: 'editor' });

    expect(res.status).toBe(200);
    expect(userRoleBulkCreateSpy).not.toHaveBeenCalled();
  });

  it('returns 500 when bulk creation fails', async () => {
    userRoleBulkCreateSpy.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .post('/api/projects/proj1/invite')
      .send({ guestIds: ['guest1'], roleType: 'editor' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: 'DB error' });
  });

  it('prevents non-admins from inviting members', async () => {
    adminMiddleware.mockImplementationOnce(
      (_req: AuthenticatedRequest, res: Response) => {
        res.status(403).json({ message: 'Adminロールが必要です' });
      }
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
    adminMiddleware.mockImplementationOnce(
      (_req: AuthenticatedRequest, res: Response) => {
        res.status(403).json({ message: 'Adminロールが必要です' });
      }
    );
    const res = await request(app).delete('/api/projects/proj1/invite/guest1');
    expect(res.status).toBe(403);
  });
});
