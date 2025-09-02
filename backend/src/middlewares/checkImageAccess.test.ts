import type { Request, Response } from 'express';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkImageAccess } from './checkImageAccess';
import ImageModel from '../models/Image';
import PartPropertyModel from '../models/PartProperty';
import { hasPermission } from '../helpers/roleHelper';
import { UnauthorizedError, ForbiddenError } from '../errors/CustomError';

vi.mock('../models/Image', () => ({
  default: { findByPk: vi.fn() },
}));
vi.mock('../models/PartProperty', () => ({
  default: { findAll: vi.fn() },
}));
vi.mock('../helpers/roleHelper', () => ({
  hasPermission: vi.fn(),
}));

const mockedFindByPk = ImageModel.findByPk as unknown as ReturnType<
  typeof vi.fn
>;
const mockedFindAll = PartPropertyModel.findAll as unknown as ReturnType<
  typeof vi.fn
>;
const mockedHasPermission = hasPermission as unknown as ReturnType<
  typeof vi.fn
>;

beforeEach(() => {
  mockedFindByPk.mockReset();
  mockedFindAll.mockReset();
  mockedHasPermission.mockReset();
});

describe('checkImageAccess middleware', () => {
  it('allows access when user uploaded image', async () => {
    const req = {
      params: { imageId: 'img1' },
      user: { id: 'user1' },
    } as unknown as Request;
    const res = { locals: {} } as unknown as Response;
    const next = vi.fn();

    mockedFindByPk.mockResolvedValue({
      id: 'img1',
      uploaderUserId: 'user1',
      storagePath: 'path',
      contentType: 'image/png',
    });

    await checkImageAccess(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.locals.image).toEqual(expect.objectContaining({ id: 'img1' }));
  });

  it('denies access for unauthenticated user', async () => {
    const req = { params: { imageId: 'img1' } } as unknown as Request;
    const res = { locals: {} } as unknown as Response;
    const next = vi.fn();

    await checkImageAccess(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0] as UnauthorizedError;
    expect(error.statusCode).toBe(401);
    expect(mockedFindByPk).not.toHaveBeenCalled();
  });

  it('allows access when user has project permission', async () => {
    const req = {
      params: { imageId: 'img1' },
      user: { id: 'user2' },
    } as unknown as Request;
    const res = { locals: {} } as unknown as Response;
    const next = vi.fn();

    mockedFindByPk.mockResolvedValue({
      id: 'img1',
      uploaderUserId: 'user1',
      storagePath: 'path',
      contentType: 'image/png',
    });
    mockedFindAll.mockResolvedValue([
      { part: { Prototype: { projectId: 'proj1' } } },
    ]);
    mockedHasPermission.mockResolvedValue(true);

    await checkImageAccess(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.locals.image).toEqual(expect.objectContaining({ id: 'img1' }));
  });

  it('denies access when user not uploader and lacks project permission', async () => {
    const req = {
      params: { imageId: 'img1' },
      user: { id: 'user2' },
    } as unknown as Request;
    const res = { locals: {} } as unknown as Response;
    const next = vi.fn();

    mockedFindByPk.mockResolvedValue({
      id: 'img1',
      uploaderUserId: 'user1',
      storagePath: 'path',
      contentType: 'image/png',
    });
    mockedFindAll.mockResolvedValue([
      { part: { Prototype: { projectId: 'proj1' } } },
    ]);
    mockedHasPermission.mockResolvedValue(false);

    await checkImageAccess(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0] as ForbiddenError;
    expect(error.statusCode).toBe(403);
  });
});
