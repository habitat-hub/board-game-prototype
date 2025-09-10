import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cleanupFileIfUnused } from './fileCleanupService';
import sequelize from '../models/index';
import FileModel from '../models/File';
import { deleteFileFromS3 } from './fileDeleteService';

vi.mock('../models/index', () => ({
  default: { query: vi.fn() },
}));

vi.mock('../models/File', () => ({
  default: { findByPk: vi.fn() },
}));

vi.mock('./fileDeleteService', () => ({
  deleteFileFromS3: vi.fn(),
}));

const mockedQuery = sequelize.query as unknown as ReturnType<typeof vi.fn>;
const mockedFindByPk = FileModel.findByPk as unknown as ReturnType<
  typeof vi.fn
>;
const mockedDeleteFileFromS3 = deleteFileFromS3 as unknown as ReturnType<
  typeof vi.fn
>;

beforeEach(() => {
  mockedQuery.mockReset();
  mockedFindByPk.mockReset();
  mockedDeleteFileFromS3.mockReset();
});

describe('cleanupFileIfUnused', () => {
  it('returns { deleted: false } when file is referenced by multiple parts', async () => {
    mockedQuery.mockResolvedValueOnce([{ count: 2 }]);
    mockedQuery.mockResolvedValueOnce([]);

    const result = await cleanupFileIfUnused('file1', 'part1', 'front');

    expect(result).toEqual({ deleted: false });
    expect(mockedQuery).toHaveBeenCalledTimes(2);
    expect(mockedFindByPk).not.toHaveBeenCalled();
    expect(mockedDeleteFileFromS3).not.toHaveBeenCalled();
  });

  it('deletes S3 object and DB record when file referenced once', async () => {
    mockedQuery.mockResolvedValueOnce([{ count: 1 }]);
    const mockDestroy = vi.fn();
    mockedFindByPk.mockResolvedValue({
      storagePath: 'path/to/file',
      destroy: mockDestroy,
    });

    const result = await cleanupFileIfUnused('file1', 'part1', 'front');

    expect(result).toEqual({ deleted: true });
    expect(mockedFindByPk).toHaveBeenCalledWith('file1');
    expect(mockedDeleteFileFromS3).toHaveBeenCalledWith('path/to/file');
    expect(mockDestroy).toHaveBeenCalled();
    expect(mockedQuery).toHaveBeenCalledTimes(1);
  });
});
