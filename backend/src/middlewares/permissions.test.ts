import type { Request, Response } from 'express';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  checkProjectOwner,
  checkPermission,
  checkProjectReadPermission,
  checkPrototypeWritePermission,
} from './permissions';
import ProjectModel from '../models/Project';
import { hasPermission } from '../helpers/roleHelper';
import { PERMISSION_ACTIONS, RESOURCE_TYPES } from '../const';

vi.mock('../models/Project', () => ({
  default: { findByPk: vi.fn() },
}));

vi.mock('../helpers/roleHelper', () => ({
  hasPermission: vi.fn(),
}));

const mockedFindByPk = ProjectModel.findByPk as unknown as ReturnType<
  typeof vi.fn
>;
const mockedHasPermission = hasPermission as unknown as ReturnType<
  typeof vi.fn
>;

function createRes() {
  const json = vi.fn();
  const status = vi.fn().mockReturnThis();
  const res = { status, json, locals: {} } as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
  return res;
}

beforeEach(() => {
  mockedFindByPk.mockReset();
  mockedHasPermission.mockReset();
});

describe('checkProjectOwner', () => {
  it('calls next when user is the project owner', async () => {
    const req = {
      params: { projectId: 'proj1' },
      user: { id: 'user1' },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    mockedFindByPk.mockResolvedValue({ id: 'proj1', userId: 'user1' });

    await checkProjectOwner(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when unauthenticated', async () => {
    const req = { params: { projectId: 'proj1' } } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await checkProjectOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: '認証が必要です' });
    expect(next).not.toHaveBeenCalled();
    expect(mockedFindByPk).not.toHaveBeenCalled();
  });

  it('returns 400 when projectId param is missing', async () => {
    const req = { params: {}, user: { id: 'user1' } } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await checkProjectOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: '必要なパラメータが不足しています',
    });
    expect(next).not.toHaveBeenCalled();
    expect(mockedFindByPk).not.toHaveBeenCalled();
  });

  it('returns 403 when user is not the project owner', async () => {
    const req = {
      params: { projectId: 'proj1' },
      user: { id: 'user2' },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    mockedFindByPk.mockResolvedValue({ id: 'proj1', userId: 'user1' });

    await checkProjectOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'プロジェクトの作成者ではありません',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 500 on unexpected errors', async () => {
    const req = {
      params: { projectId: 'proj1' },
      user: { id: 'user1' },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mockedFindByPk.mockRejectedValue(new Error('DB failure'));

    await checkProjectOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: '予期せぬエラーが発生しました',
    });
    expect(next).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});

describe('checkPermission factory and wrappers', () => {
  it('allows when hasPermission resolves true and passes correct args (project read)', async () => {
    const req = {
      params: { projectId: 'proj1' },
      user: { id: 'user1' },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    mockedHasPermission.mockResolvedValue(true);

    await checkProjectReadPermission(req, res, next);

    expect(mockedHasPermission).toHaveBeenCalledWith(
      'user1',
      RESOURCE_TYPES.PROJECT,
      PERMISSION_ACTIONS.READ,
      'proj1'
    );
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('denies with 403 when hasPermission resolves false (prototype write)', async () => {
    const req = {
      params: { prototypeId: 'proto1' },
      user: { id: 'user1' },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    mockedHasPermission.mockResolvedValue(false);

    await checkPrototypeWritePermission(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'prototypeへのwrite権限がありません',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when unauthenticated', async () => {
    const req = { params: { projectId: 'proj1' } } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await checkProjectReadPermission(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: '認証が必要です' });
    expect(next).not.toHaveBeenCalled();
    expect(mockedHasPermission).not.toHaveBeenCalled();
  });

  it('returns 400 when resource id param is missing', async () => {
    const req = { params: {}, user: { id: 'user1' } } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await checkProjectReadPermission(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: '必要なパラメータが不足しています',
    });
    expect(next).not.toHaveBeenCalled();
    expect(mockedHasPermission).not.toHaveBeenCalled();
  });

  it('returns 500 when hasPermission throws', async () => {
    const req = {
      params: { prototypeId: 'proto1' },
      user: { id: 'user1' },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mockedHasPermission.mockRejectedValue(new Error('RBAC failure'));

    const middleware = checkPermission(
      RESOURCE_TYPES.PROTOTYPE,
      PERMISSION_ACTIONS.READ,
      'prototypeId'
    );

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: '予期せぬエラーが発生しました',
    });
    expect(next).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
