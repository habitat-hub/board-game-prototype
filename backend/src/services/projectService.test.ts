import { describe, it, expect, vi } from 'vitest';

vi.mock('../models', () => ({ default: { transaction: vi.fn() } }));
vi.mock('../helpers/prototypeHelper', () => ({
  getAccessiblePrototypes: vi.fn(),
}));
vi.mock('../factories/prototypeFactory', () => ({
  createProject: vi.fn(),
}));

import sequelize from '../models';
import { getAccessiblePrototypes } from '../helpers/prototypeHelper';
import { createProject } from '../factories/prototypeFactory';
import { listAccessibleProjects, createProjectService } from './projectService';

describe('projectService', () => {
  it('listAccessibleProjects returns projects', async () => {
    const mockProjects: Array<{ id: string }> = [{ id: '1' }];
    (getAccessiblePrototypes as unknown as ViMock).mockResolvedValue(
      mockProjects
    );

    const result = await listAccessibleProjects('user1');
    expect(result).toEqual(mockProjects);
    expect(getAccessiblePrototypes).toHaveBeenCalledWith({ userId: 'user1' });
  });

  it('createProjectService commits transaction', async () => {
    const commit = vi.fn();
    const rollback = vi.fn();
    (sequelize.transaction as ViMock).mockResolvedValue({ commit, rollback });
    (createProject as unknown as ViMock).mockResolvedValue({ id: 'p1' });

    const project = await createProjectService({
      userId: 'u1',
      name: 'test',
    });

    expect(project).toEqual({ id: 'p1' });
    expect(commit).toHaveBeenCalled();
    expect(rollback).not.toHaveBeenCalled();
  });
});

type ViMock = ReturnType<typeof vi.fn>;
