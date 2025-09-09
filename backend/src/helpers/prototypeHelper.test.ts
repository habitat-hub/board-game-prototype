import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeAll,
  type Mock,
} from 'vitest';

const mockProjectScope = vi.fn();
const mockGetAccessibleResourceIds = vi.fn();

vi.mock('../models/Part', () => ({
  default: { update: vi.fn(), findAll: vi.fn() },
}));
vi.mock('../models/PartProperty', () => ({ default: {} }));
vi.mock('../models/Image', () => ({ default: {} }));
vi.mock('../config/env', () => ({
  default: { DATABASE_URL: 'postgres://test' },
}));
vi.mock('../models/Project', () => ({ default: { scope: mockProjectScope } }));
vi.mock('./roleHelper', () => ({
  getAccessibleResourceIds: mockGetAccessibleResourceIds,
}));
vi.mock('../const', () => ({ RESOURCE_TYPES: {}, PERMISSION_ACTIONS: {} }));

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
      toJSON: () => ({
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
      }),
    };

    mockGetAccessibleResourceIds.mockResolvedValue(['proj1']);
    mockProjectScope.mockReturnValue({
      findAll: vi.fn().mockResolvedValue([project]),
    });

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

    const updateSpy = vi.spyOn(PartModel, 'update').mockImplementation((async (
      values: { order: number },
      options: { where: { id: number } }
    ): Promise<[number, { dataValues: { id: number; order: number } }[]]> => {
      return [
        1,
        [
          {
            dataValues: {
              id: options.where.id,
              order: values.order,
            },
          },
        ],
      ];
    }) as unknown as PartModelType['update']);

    const updated = await persistDeckOrder(shuffled);
    expect(updated).toEqual([
      { id: 3, order: 1 },
      { id: 1, order: 2 },
      { id: 2, order: 3 },
    ]);

    expect(updateSpy).toHaveBeenCalledTimes(3);
  });
});
