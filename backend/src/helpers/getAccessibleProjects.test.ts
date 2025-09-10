import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('../config/env', () => ({
  default: { DATABASE_URL: 'postgres://test' },
}));
vi.mock('../models/Part', () => ({ default: {} }));
vi.mock('../models/PartProperty', () => ({ default: {} }));
vi.mock('../models/File', () => ({ default: {} }));
vi.mock('./roleHelper', () => ({ getAccessibleResourceIds: vi.fn() }));
vi.mock('../const', () => ({
  RESOURCE_TYPES: { PROJECT: 'project' },
  PERMISSION_ACTIONS: { READ: 'read' },
}));

const findAll = vi.fn();
vi.mock('../models/Project', () => ({
  default: { scope: vi.fn().mockReturnValue({ findAll }) },
}));

let getAccessibleProjects: typeof import('./prototypeHelper').getAccessibleProjects;
let getAccessibleResourceIds: typeof import('./roleHelper').getAccessibleResourceIds;

beforeAll(async () => {
  process.env.DATABASE_URL = 'postgres://test';
  process.env.FRONTEND_URL = 'http://localhost';
  process.env.FRONTEND_DOMAIN = 'localhost';
  process.env.SESSION_SECRET = 'secret';
  process.env.GOOGLE_CLIENT_ID = 'id';
  process.env.GOOGLE_CLIENT_SECRET = 'secret';
  process.env.GOOGLE_CALLBACK_URL = 'http://localhost';
  process.env.AWS_REGION = 'us-east-1';
  process.env.AWS_ACCESS_KEY_ID = 'key';
  process.env.AWS_SECRET_ACCESS_KEY = 'secret';
  process.env.AWS_S3_BUCKET_NAME = 'bucket';

  ({ getAccessibleProjects } = await import('./prototypeHelper'));
  ({ getAccessibleResourceIds } = await import('./roleHelper'));
});

describe('getAccessibleProjects', () => {
  it('requests projects ordered by createdAt descending', async () => {
    (
      getAccessibleResourceIds as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue(['1', '2']);
    findAll.mockResolvedValue([]);

    await getAccessibleProjects({ userId: 'user1' });
    expect(findAll).toHaveBeenCalled();
    const args = findAll.mock.calls[0][0];
    expect(args.order).toEqual([['createdAt', 'DESC']]);
  });
});
