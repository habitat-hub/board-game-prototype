import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../models/UserRole', () => ({
  default: { findAll: vi.fn() },
}));
vi.mock('../models/Role', () => ({ default: {} }));
vi.mock('../models/Permission', () => ({ default: {} }));
vi.mock('../models/Prototype', () => ({
  default: { findByPk: vi.fn() },
}));

import { hasPermission } from './roleHelper';
import UserRoleModel from '../models/UserRole';
import PrototypeModel from '../models/Prototype';

const findAllMock = UserRoleModel.findAll as unknown as ReturnType<
  typeof vi.fn
>;
const findPrototypeMock = PrototypeModel.findByPk as unknown as ReturnType<
  typeof vi.fn
>;

describe('hasPermission interact behaviour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows interact via project role when prototype is instance', async () => {
    findPrototypeMock.mockResolvedValue({
      id: 'proto-1',
      projectId: 'proj-1',
      type: 'INSTANCE',
    });
    findAllMock.mockResolvedValueOnce([]);
    findAllMock.mockResolvedValueOnce([{ id: 'ur-1' }]);

    const result = await hasPermission(
      'user-1',
      'prototype',
      'interact',
      'proto-1'
    );

    expect(result).toBe(true);
    expect(findAllMock).toHaveBeenCalledTimes(2);
  });

  it('denies interact when prototype is not an instance', async () => {
    findPrototypeMock.mockResolvedValue({
      id: 'proto-2',
      projectId: 'proj-2',
      type: 'MASTER',
    });

    const result = await hasPermission(
      'user-2',
      'prototype',
      'interact',
      'proto-2'
    );

    expect(result).toBe(false);
    expect(findAllMock).not.toHaveBeenCalled();
  });
});
