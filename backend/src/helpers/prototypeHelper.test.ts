import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';

vi.mock('../models/Part', () => ({
  default: { update: vi.fn() },
}));
vi.mock('../config/env', () => ({ default: {} }));
vi.mock('../models/Project', () => ({ default: {} }));
vi.mock('./roleHelper', () => ({ getAccessibleResourceIds: vi.fn() }));
vi.mock('../const', () => ({ RESOURCE_TYPES: {}, PERMISSION_ACTIONS: {} }));

let PartModel: any;
let shuffleArray: any;
let shuffleDeck: any;
let persistDeckOrder: any;

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
  ({ shuffleArray, shuffleDeck, persistDeckOrder } = await import(
    './prototypeHelper'
  ));
});

afterEach(() => {
  vi.restoreAllMocks();
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

    const shuffled = shuffleDeck(cards);
    expect(shuffled).toEqual([
      { id: 3, order: 1 },
      { id: 1, order: 2 },
      { id: 2, order: 3 },
    ]);

    expect(cards.map((c) => c.order)).toEqual([1, 2, 3]);

    const updateSpy = vi
      .spyOn(PartModel, 'update')
      .mockImplementation(async (values: any, options: any) => {
        return [
          1,
          [{ dataValues: { id: options.where.id, order: values.order } }],
        ] as any;
      });

    const updated = await persistDeckOrder(shuffled);
    expect(updated).toEqual([
      { id: 3, order: 1 },
      { id: 1, order: 2 },
      { id: 2, order: 3 },
    ]);

    expect(updateSpy).toHaveBeenCalledTimes(3);
  });
});
