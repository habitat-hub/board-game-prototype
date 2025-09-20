import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeAll,
  type Mock,
} from 'vitest';
import { Op } from 'sequelize';

const mockProjectScope = vi.fn();
const mockGetAccessibleResourceIds = vi.fn();
const mockUserRoleFindAll = vi.fn();

vi.mock('../models/Part', () => ({
  default: { update: vi.fn(), findAll: vi.fn(), bulkCreate: vi.fn() },
}));
vi.mock('../models/PartProperty', () => ({ default: {} }));
vi.mock('../models/Image', () => ({ default: {} }));
vi.mock('../models/User', () => ({ default: {} }));
vi.mock('../models/UserRole', () => ({
  default: { findAll: mockUserRoleFindAll },
}));
vi.mock('../models/Role', () => ({ default: {} }));
vi.mock('../config/env', () => ({
  default: { DATABASE_URL: 'postgres://test' },
}));
vi.mock('../models/Project', () => ({ default: { scope: mockProjectScope } }));
vi.mock('./roleHelper', () => ({
  getAccessibleResourceIds: mockGetAccessibleResourceIds,
}));
vi.mock('../const', () => ({
  RESOURCE_TYPES: { PROJECT: 'project' },
  PERMISSION_ACTIONS: {},
  ROLE_TYPE: { ADMIN: 'admin', EDITOR: 'editor', VIEWER: 'viewer' },
}));

type PartModelType = typeof import('../models/Part').default;
let PartModel: PartModelType;
let shuffleArray: typeof import('./prototypeHelper').shuffleArray;
let shuffleDeck: typeof import('./prototypeHelper').shuffleDeck;
let persistDeckOrder: typeof import('./prototypeHelper').persistDeckOrder;
let getAccessiblePrototypes: typeof import('./prototypeHelper').getAccessiblePrototypes;
let helperModule: typeof import('./prototypeHelper');

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

  PartModel = (await import('../models/Part')).default;
  helperModule = await import('./prototypeHelper');
  ({ shuffleArray, shuffleDeck, persistDeckOrder, getAccessiblePrototypes } =
    helperModule);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getAccessiblePrototypes', () => {
  it('returns parts, properties, and images for each prototype', async () => {
    const project = {
      id: 'proj1',
      userId: 'user1',
      get: () => ({
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        prototypes: [
          {
            id: 'master1',
            name: 'Master',
            type: 'MASTER',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
          {
            id: 'version1',
            name: 'Version',
            type: 'VERSION',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
        User: {
          id: 'user1',
          username: 'Owner',
        },
      }),
    };

    mockGetAccessibleResourceIds.mockResolvedValue(['proj1']);
    mockProjectScope.mockReturnValue({
      findAll: vi.fn().mockResolvedValue([project]),
    });
    mockUserRoleFindAll.mockResolvedValue([
      {
        resourceId: 'proj1',
        Role: { name: 'admin' },
      },
    ]);

    (PartModel.findAll as unknown as Mock).mockResolvedValue([
      {
        prototypeId: 'master1',
        toJSON: () => ({
          id: 1,
          prototypeId: 'master1',
          partProperties: [{ side: 'front', image: { id: 'img1' } }],
        }),
      },
      {
        prototypeId: 'version1',
        toJSON: () => ({
          id: 2,
          prototypeId: 'version1',
          partProperties: [{ side: 'front', image: { id: 'img2' } }],
        }),
      },
    ] as unknown as InstanceType<PartModelType>[]);

    const result = await getAccessiblePrototypes({ userId: 'user1' });

    expect(result).toEqual([
      {
        project: {
          id: 'proj1',
          userId: 'user1',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
          owner: {
            id: 'user1',
            username: 'Owner',
          },
          permissions: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canManage: true,
          },
        },
        prototypes: [
          {
            id: 'master1',
            name: 'Master',
            type: 'MASTER',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            parts: [
              {
                id: 1,
                prototypeId: 'master1',
                partProperties: [
                  {
                    side: 'front',
                    image: { id: 'img1' },
                  },
                ],
              },
            ],
          },
          {
            id: 'version1',
            name: 'Version',
            type: 'VERSION',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            parts: [
              {
                id: 2,
                prototypeId: 'version1',
                partProperties: [
                  {
                    side: 'front',
                    image: { id: 'img2' },
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);
  });
});

describe('shuffleArray', () => {
  it('shuffles array without mutating original', () => {
    const randomSpy = vi
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0);

    const original = [1, 2, 3];
    const result = shuffleArray(original);

    expect(original).toEqual([1, 2, 3]);
    expect(result).toEqual([3, 1, 2]);

    randomSpy.mockRestore();
  });
});

describe('shuffleDeck and persistDeckOrder', () => {
  it('shuffles deck and persists order', async () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.5).mockReturnValueOnce(0);

    const cards = [
      { id: 1, order: 1 },
      { id: 2, order: 2 },
      { id: 3, order: 3 },
    ];

    const shuffled = shuffleDeck(
      cards as unknown as InstanceType<PartModelType>[]
    );
    expect(shuffled).toEqual([
      { id: 3, order: 1 },
      { id: 1, order: 2 },
      { id: 2, order: 3 },
    ]);

    expect(cards.map((c) => c.order)).toEqual([1, 2, 3]);

    const createPartMock = (card: { id: number; order: number }) => {
      const base = {
        id: card.id,
        order: card.order,
        type: 'card' as const,
        prototypeId: 'proto-1',
        position: { x: 0, y: 0 },
        width: 100,
        height: 150,
        frontSide: 'front' as const,
        ownerId: null as string | null,
        createdAt: new Date('2025-09-15T00:00:00Z'),
        updatedAt: new Date('2025-09-15T00:00:00Z'),
      };

      const backing: Record<string, unknown> = { ...base };
      const instance = backing as unknown as InstanceType<PartModelType>;

      instance.get = vi.fn(() => ({
        ...base,
      })) as InstanceType<PartModelType>['get'];
      instance.set = vi
        .fn((key: string, value: unknown) => {
          (base as Record<string, unknown>)[key] = value;
          (backing as Record<string, unknown>)[key] = value;
          return instance;
        })
        .mockName('set') as unknown as InstanceType<PartModelType>['set'];
      instance.toJSON = vi.fn(() => ({
        ...base,
      })) as InstanceType<PartModelType>['toJSON'];

      return instance;
    };

    const existingParts = cards.map((card) => createPartMock(card));

    const bulkCreateSpy = vi
      .spyOn(PartModel, 'bulkCreate')
      .mockResolvedValue([] as never);
    const findAllSpy = vi
      .spyOn(PartModel, 'findAll')
      .mockResolvedValue(existingParts);

    const updated = await persistDeckOrder(shuffled);
    expect(updated.map((part) => ({ id: part.id, order: part.order }))).toEqual(
      [
        { id: 3, order: 1 },
        { id: 1, order: 2 },
        { id: 2, order: 3 },
      ]
    );

    expect(bulkCreateSpy).toHaveBeenCalledTimes(1);
    expect(bulkCreateSpy.mock.calls[0][1]).toEqual({
      updateOnDuplicate: ['order', 'updatedAt'],
    });

    const [payload] = bulkCreateSpy.mock.calls[0];
    expect(payload).toHaveLength(3);
    expect(payload).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 3, order: 1, type: 'card' }),
        expect.objectContaining({ id: 1, order: 2, type: 'card' }),
        expect.objectContaining({ id: 2, order: 3, type: 'card' }),
      ])
    );
    payload.forEach((entry: Record<string, unknown>) => {
      expect(entry.updatedAt).toBeInstanceOf(Date);
    });

    existingParts.forEach((part) => {
      expect(part.set).toHaveBeenCalledWith('order', expect.any(Number));
      expect(part.set).toHaveBeenCalledWith('updatedAt', expect.any(Date));
    });

    expect(findAllSpy).toHaveBeenCalledTimes(1);
    const findAllArgs = findAllSpy.mock.calls[0]?.[0] as {
      where: { id: Record<typeof Op.in, number[]> };
    };
    expect(findAllArgs.where.id[Op.in]).toEqual([3, 1, 2]);
  });
});
