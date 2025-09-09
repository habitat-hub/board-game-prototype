import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Transaction } from 'sequelize';

import { duplicateProject } from './prototypeFactory';
import PrototypeModel from '../models/Prototype';
import ProjectModel from '../models/Project';
import PartModel from '../models/Part';
import PartPropertyModel from '../models/PartProperty';
import RoleModel from '../models/Role';
import { assignRole } from '../helpers/roleHelper';

vi.mock('../models/Prototype', () => ({
  default: { findOne: vi.fn(), create: vi.fn() },
}));
vi.mock('../models/Project', () => ({
  default: { create: vi.fn() },
}));
vi.mock('../models/Part', () => ({
  default: { findAll: vi.fn(), create: vi.fn() },
}));
vi.mock('../models/PartProperty', () => ({
  default: { findAll: vi.fn(), create: vi.fn() },
}));
vi.mock('../models/Role', () => ({
  default: { findOne: vi.fn() },
}));
vi.mock('../helpers/roleHelper', () => ({
  assignRole: vi.fn(),
}));

const prototypeFindOne = PrototypeModel.findOne as unknown as ReturnType<
  typeof vi.fn
>;
const prototypeCreate = PrototypeModel.create as unknown as ReturnType<
  typeof vi.fn
>;
const projectCreate = ProjectModel.create as unknown as ReturnType<
  typeof vi.fn
>;
const partFindAll = PartModel.findAll as unknown as ReturnType<typeof vi.fn>;
const partCreate = PartModel.create as unknown as ReturnType<typeof vi.fn>;
const partPropertyFindAll = PartPropertyModel.findAll as unknown as ReturnType<
  typeof vi.fn
>;
const partPropertyCreate = PartPropertyModel.create as unknown as ReturnType<
  typeof vi.fn
>;
const roleFindOne = RoleModel.findOne as unknown as ReturnType<typeof vi.fn>;
const assignRoleMock = assignRole as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  prototypeFindOne.mockReset();
  prototypeCreate.mockReset();
  projectCreate.mockReset();
  partFindAll.mockReset();
  partCreate.mockReset();
  partPropertyFindAll.mockReset();
  partPropertyCreate.mockReset();
  roleFindOne.mockReset();
  assignRoleMock.mockReset();
});

describe('duplicateProject', () => {
  it('duplicates a project with its master prototype', async () => {
    prototypeFindOne.mockResolvedValue({
      id: 'master1',
      name: 'Master',
      projectId: 'proj1',
      type: 'MASTER',
    });
    projectCreate.mockResolvedValue({ id: 'new-project', userId: 'user2' });
    prototypeCreate.mockResolvedValue({
      id: 'new-master',
      projectId: 'new-project',
      name: 'Master-copy',
      type: 'MASTER',
    });
    partFindAll.mockResolvedValue([
      {
        id: 1,
        type: 'card',
        prototypeId: 'master1',
        position: { x: 0, y: 0 },
        width: 10,
        height: 20,
        order: 1,
        frontSide: 'front',
        ownerId: null,
      },
    ]);
    partPropertyFindAll.mockResolvedValue([
      {
        partId: 1,
        side: 'front',
        name: 'name',
        description: 'desc',
        color: '#fff',
        textColor: '#000',
        imageId: null,
      },
    ]);
    partCreate.mockResolvedValue({ id: 2 });
    roleFindOne.mockResolvedValue({ id: 'role-admin' });

    const result = await duplicateProject({
      projectId: 'proj1',
      userId: 'user2',
      transaction: {} as unknown as Transaction,
    });

    expect(projectCreate).toHaveBeenCalled();
    expect(prototypeCreate).toHaveBeenCalled();
    expect(prototypeCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Master-copy' }),
      expect.anything()
    );
    expect(partCreate).toHaveBeenCalled();
    expect(partPropertyCreate).toHaveBeenCalled();
    expect(assignRoleMock).toHaveBeenCalled();
    expect(result.project.id).toBe('new-project');
    expect(result.prototypes[0].id).toBe('new-master');
  });
});
