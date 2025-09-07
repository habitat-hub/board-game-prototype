import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cleanupImageIfUnused } from './imageCleanupService';
import sequelize from '../models/index';
import ImageModel from '../models/Image';
import { deleteImageFromS3 } from './imageDeleteService';

vi.mock('../models/index', () => ({
  default: { query: vi.fn() },
}));

vi.mock('../models/Image', () => ({
  default: { findByPk: vi.fn() },
}));

vi.mock('./imageDeleteService', () => ({
  deleteImageFromS3: vi.fn(),
}));

const mockedQuery = sequelize.query as unknown as ReturnType<typeof vi.fn>;
const mockedFindByPk = ImageModel.findByPk as unknown as ReturnType<
  typeof vi.fn
>;
const mockedDeleteImageFromS3 = deleteImageFromS3 as unknown as ReturnType<
  typeof vi.fn
>;

beforeEach(() => {
  mockedQuery.mockReset();
  mockedFindByPk.mockReset();
  mockedDeleteImageFromS3.mockReset();
});

describe('cleanupImageIfUnused', () => {
  it('returns { deleted: false } when image is referenced by multiple parts', async () => {
    mockedQuery.mockResolvedValueOnce([{ count: 2 }]);
    mockedQuery.mockResolvedValueOnce([]);

    const result = await cleanupImageIfUnused('img1', 'part1', 'front');

    expect(result).toEqual({ deleted: false });
    expect(mockedQuery).toHaveBeenCalledTimes(2);
    expect(mockedFindByPk).not.toHaveBeenCalled();
    expect(mockedDeleteImageFromS3).not.toHaveBeenCalled();
  });

  it('deletes S3 object and DB record when image referenced once', async () => {
    mockedQuery.mockResolvedValueOnce([{ count: 1 }]);
    const mockDestroy = vi.fn();
    mockedFindByPk.mockResolvedValue({
      storagePath: 'path/to/image',
      destroy: mockDestroy,
    });

    const result = await cleanupImageIfUnused('img1', 'part1', 'front');

    expect(result).toEqual({ deleted: true });
    expect(mockedFindByPk).toHaveBeenCalledWith('img1');
    expect(mockedDeleteImageFromS3).toHaveBeenCalledWith('path/to/image');
    expect(mockDestroy).toHaveBeenCalled();
    expect(mockedQuery).toHaveBeenCalledTimes(1);
  });
});
