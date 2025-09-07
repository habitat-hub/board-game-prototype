import type { Request, Response } from 'express';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { checkProjectReadPermission } from './permissions';
import { hasPermission } from '../helpers/roleHelper';

vi.mock('../helpers/roleHelper', () => ({
  hasPermission: vi.fn(),
}));

const mockedHasPermission = hasPermission as unknown as ReturnType<
  typeof vi.fn
>;

function createRes() {
  const json = vi.fn();
  const status = vi.fn().mockReturnThis();
  const res = { status, json } as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
  return res;
}

beforeEach(() => {
  mockedHasPermission.mockReset();
});

describe('checkProjectReadPermission deny', () => {
  it('returns 403 when user lacks project read permission', async () => {
    const req = {
      params: { projectId: 'proj1' },
      user: { id: 'user1' },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    mockedHasPermission.mockResolvedValue(false);

    await checkProjectReadPermission(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'projectへのread権限がありません',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
