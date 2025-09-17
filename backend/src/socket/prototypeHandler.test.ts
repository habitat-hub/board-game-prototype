/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const {
  partBulkCreateMock,
  partFindAllMock,
  partFindOneMock,
  partUpdateMock,
  partTransactionMock,
  partPropertyBulkCreateMock,
  partPropertyFindAllMock,
  hasPermissionMock,
} = vi.hoisted(() => ({
  partBulkCreateMock: vi.fn(),
  partFindAllMock: vi.fn(),
  partFindOneMock: vi.fn(),
  partUpdateMock: vi.fn(),
  partTransactionMock: vi.fn(),
  partPropertyBulkCreateMock: vi.fn(),
  partPropertyFindAllMock: vi.fn(),
  hasPermissionMock: vi.fn(),
}));

vi.mock('../models/Part', () => ({
  default: {
    bulkCreate: partBulkCreateMock,
    findAll: partFindAllMock,
    findOne: partFindOneMock,
    update: partUpdateMock,
    sequelize: { transaction: partTransactionMock },
  },
}));
vi.mock('../models/PartProperty', () => ({
  default: {
    bulkCreate: partPropertyBulkCreateMock,
    findAll: partPropertyFindAllMock,
  },
}));
vi.mock('../models/User', () => ({
  default: {},
}));
vi.mock('../models/Image', () => ({
  default: {},
}));
vi.mock('../helpers/prototypeHelper', () => ({
  shuffleDeck: vi.fn(),
  persistDeckOrder: vi.fn(),
  isOverlapping: vi.fn(),
}));
vi.mock('../models/Prototype', () => ({
  default: { findByPk: vi.fn() },
}));
vi.mock('../helpers/roleHelper', () => ({
  hasPermission: hasPermissionMock,
}));

import handlePrototype, {
  connectedUsersMap,
  rebalanceOrders,
} from './prototypeHandler';
import PrototypeModel from '../models/Prototype';
import type PartModel from '../models/Part';
import {
  COMMON_SOCKET_EVENT,
  PROJECT_SOCKET_EVENT,
  PROTOTYPE_SOCKET_EVENT,
} from '../constants/socket';
import { ORDER_MIN_EXCLUSIVE, ORDER_RANGE } from '../constants/prototype';

type MockPartValues = {
  id: number;
  type: 'token' | 'card' | 'hand' | 'deck' | 'area';
  prototypeId: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  order: number;
  frontSide: 'front' | 'back' | null;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

class MockPart {
  public dataValues: MockPartValues;

  constructor(
    id: number,
    order: number,
    overrides: Partial<MockPartValues> = {}
  ) {
    const defaultTimestamp = new Date('2025-09-16T00:00:00.000Z');
    const createdAt = overrides.createdAt ?? defaultTimestamp;
    const updatedAt = overrides.updatedAt ?? defaultTimestamp;

    this.dataValues = {
      id,
      order,
      type: overrides.type ?? 'token',
      prototypeId: overrides.prototypeId ?? 'proto-rebalance',
      position: overrides.position ?? { x: 0, y: 0 },
      width: overrides.width ?? 100,
      height: overrides.height ?? 100,
      frontSide: overrides.frontSide ?? null,
      ownerId: overrides.ownerId ?? null,
      createdAt,
      updatedAt,
    };
  }

  get id(): number {
    return this.dataValues.id;
  }

  get type(): MockPartValues['type'] {
    return this.dataValues.type;
  }

  get prototypeId(): string {
    return this.dataValues.prototypeId;
  }

  get position(): MockPartValues['position'] {
    return this.dataValues.position;
  }

  get width(): number {
    return this.dataValues.width;
  }

  get height(): number {
    return this.dataValues.height;
  }

  get frontSide(): MockPartValues['frontSide'] {
    return this.dataValues.frontSide;
  }

  get ownerId(): MockPartValues['ownerId'] {
    return this.dataValues.ownerId;
  }

  get order(): number {
    return this.dataValues.order;
  }

  set order(value: number) {
    this.dataValues.order = value;
  }

  getDataValue<TKey extends keyof MockPartValues>(key: TKey) {
    return this.dataValues[key];
  }

  setDataValue<TKey extends keyof MockPartValues>(
    key: TKey,
    value: MockPartValues[TKey]
  ) {
    this.dataValues[key] = value;
  }

  get(options?: { plain?: boolean }) {
    if (options?.plain) {
      return { ...this.dataValues };
    }
    return { ...this.dataValues };
  }
}

const mockedFindByPk = PrototypeModel.findByPk as unknown as ReturnType<
  typeof vi.fn
>;

beforeEach(() => {
  mockedFindByPk.mockReset();
  partBulkCreateMock.mockReset();
  partFindAllMock.mockReset();
  partFindOneMock.mockReset();
  partUpdateMock.mockReset();
  partTransactionMock.mockReset();
  partPropertyBulkCreateMock.mockReset();
  partPropertyFindAllMock.mockReset();
  hasPermissionMock.mockReset();
  hasPermissionMock.mockResolvedValue(true);
  for (const key in connectedUsersMap) {
    delete connectedUsersMap[key];
  }
});

describe('rebalanceOrders', () => {
  beforeEach(() => {
    partBulkCreateMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('updates orders in bulk and emits consistent socket payload', async () => {
    vi.useFakeTimers();
    const fixedNow = new Date('2025-09-16T08:30:00.000Z');
    vi.setSystemTime(fixedNow);
    const prototypeId = 'proto-rebalance';
    const parts = [
      new MockPart(1, 0.1),
      new MockPart(2, 0.2),
      new MockPart(3, 0.3),
    ];

    const emit = vi.fn();
    const toMock = vi.fn(() => ({ emit }));
    const io = { to: toMock } as any;

    partBulkCreateMock.mockResolvedValue([]);

    const partModels = parts as unknown as PartModel[];
    const result = await rebalanceOrders(prototypeId, partModels, io);

    expect(partBulkCreateMock).toHaveBeenCalledTimes(1);
    const [records, options] = partBulkCreateMock.mock.calls[0];
    const expectedFields = Object.keys(records[0] as Record<string, unknown>);
    expect(options).toEqual({
      fields: expectedFields,
      updateOnDuplicate: ['order', 'updatedAt'],
    });

    const totalParts = parts.length;
    const step = ORDER_RANGE / (totalParts + 1);
    const expectedOrders = parts.map(
      (_, index) => ORDER_MIN_EXCLUSIVE + step * (index + 1)
    );

    const typedRecords = records as MockPartValues[];
    typedRecords.forEach((record, index) => {
      expect(record.id).toBe(parts[index].id);
      expect(record.order).toBeCloseTo(expectedOrders[index], 10);
      expect(record.type).toBe(parts[index].type);
      expect(record.prototypeId).toBe(parts[index].prototypeId);
      expect(record.position).toEqual(parts[index].position);
      expect(record.width).toBe(parts[index].width);
      expect(record.height).toBe(parts[index].height);
      expect(record.updatedAt).toEqual(fixedNow);
      expect(record.createdAt).toEqual(parts[index].getDataValue('createdAt'));
    });

    expect(toMock).toHaveBeenCalledWith(prototypeId);
    const emitter = toMock.mock.results[0]?.value as { emit: typeof emit };
    expect(emitter.emit).toHaveBeenCalledWith(
      PROTOTYPE_SOCKET_EVENT.UPDATE_PARTS,
      {
        parts: parts.map((part) => part.dataValues),
        properties: [],
      }
    );

    expect(result).toBe(partModels);
    parts.forEach((part, index) => {
      expect(part.order).toBeCloseTo(expectedOrders[index], 10);
      expect(part.dataValues.order).toBeCloseTo(expectedOrders[index], 10);
      expect(part.getDataValue('updatedAt')).toEqual(fixedNow);
    });
  });
});

describe('prototypeHandler disconnect', () => {
  it('emits empty user list to project room when last user disconnects', async () => {
    const handlers: Record<string, any> = {};
    const socket = {
      id: 'socket1',
      rooms: new Set(['socket1', 'proto1']),
      data: { prototypeId: 'proto1', userId: 'user1', username: 'Alice' },
      on: vi.fn((event: string, handler: any) => {
        handlers[event] = handler;
      }),
      emit: vi.fn(),
      join: vi.fn(),
      leave: vi.fn(),
    } as any;

    const toMock = vi.fn((room: string) => {
      const emit = vi.fn();
      (toMock as any).emitters[room] = emit;
      return { emit };
    }) as any;
    (toMock as any).emitters = {};
    const io = { to: toMock } as any;

    connectedUsersMap['proto1'] = {
      user1: { userId: 'user1', username: 'Alice' },
    };

    mockedFindByPk.mockResolvedValue({ id: 'proto1', projectId: 'proj1' });

    handlePrototype(socket, io);

    await handlers[COMMON_SOCKET_EVENT.DISCONNECTING]();

    await handlers[COMMON_SOCKET_EVENT.DISCONNECT]('client disconnect');

    const projectEmitter = (toMock as any).emitters['project:proj1'];
    expect(projectEmitter).toHaveBeenLastCalledWith(
      PROJECT_SOCKET_EVENT.ROOM_CONNECTED_USERS_UPDATE,
      { prototypeId: 'proto1', users: [] }
    );
  });
});

describe('prototypeHandler update parts', () => {
  it('groups part and property updates into batched operations', async () => {
    const handlers: Record<string, any> = {};
    const socket = {
      id: 'socket1',
      data: { prototypeId: 'proto1', userId: 'user1', username: 'Alice' },
      on: vi.fn((event: string, handler: any) => {
        handlers[event] = handler;
      }),
      emit: vi.fn(),
    } as any;

    const emitters: Record<string, any> = {};
    const io = {
      to: vi.fn((room: string) => {
        const emit = vi.fn();
        emitters[room] = emit;
        return { emit };
      }),
    } as any;

    const transaction = {
      commit: vi.fn().mockResolvedValue(undefined),
      rollback: vi.fn().mockResolvedValue(undefined),
    };
    partTransactionMock.mockResolvedValue(transaction);

    partFindAllMock
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
      .mockResolvedValueOnce([
        {
          get: vi.fn().mockReturnValue({ id: 1, width: 100, height: 200 }),
        } as any,
        { get: vi.fn().mockReturnValue({ id: 2, order: 10 }) } as any,
      ]);

    partPropertyFindAllMock
      .mockResolvedValueOnce([
        { partId: 1, side: 'front' },
        { partId: 1, side: 'back' },
        { partId: 2, side: 'front' },
      ])
      .mockResolvedValueOnce([
        { partId: 1, side: 'front', name: 'Card', color: '#fff' },
        { partId: 1, side: 'back', name: 'BackName' },
      ] as any);

    partBulkCreateMock.mockResolvedValue([]);
    partPropertyBulkCreateMock.mockResolvedValue([]);

    handlePrototype(socket, io);

    await handlers[PROTOTYPE_SOCKET_EVENT.UPDATE_PARTS]({
      updates: [
        {
          partId: 1,
          updatePart: { width: 100 },
          updateProperties: [
            { side: 'front', name: 'Card' },
            { side: 'back', name: 'BackName' },
          ],
        },
        {
          partId: 1,
          updatePart: { height: 200 },
          updateProperties: [{ side: 'front', color: '#fff', partId: 999 }],
        },
        {
          partId: 2,
          updatePart: { order: 10 },
          updateProperties: [{ side: 'back', name: 'ShouldSkip' }],
        },
        {
          partId: 3,
          updatePart: { order: 5 },
        },
      ],
    });

    expect(partTransactionMock).toHaveBeenCalledTimes(1);
    expect(transaction.commit).toHaveBeenCalledTimes(1);
    expect(transaction.rollback).not.toHaveBeenCalled();

    expect(partBulkCreateMock).toHaveBeenCalledTimes(2);
    expect(partBulkCreateMock).toHaveBeenNthCalledWith(
      1,
      [{ id: 1, width: 100, height: 200 }],
      expect.objectContaining({
        fields: ['id', 'height', 'width'],
        updateOnDuplicate: ['height', 'width'],
        transaction,
      })
    );
    expect(partBulkCreateMock).toHaveBeenNthCalledWith(
      2,
      [{ id: 2, order: 10 }],
      expect.objectContaining({
        fields: ['id', 'order'],
        updateOnDuplicate: ['order'],
        transaction,
      })
    );

    expect(partPropertyBulkCreateMock).toHaveBeenCalledTimes(2);
    expect(partPropertyBulkCreateMock).toHaveBeenNthCalledWith(
      1,
      [
        {
          partId: 1,
          side: 'front',
          color: '#fff',
          name: 'Card',
        },
      ],
      expect.objectContaining({
        fields: ['partId', 'side', 'color', 'name'],
        updateOnDuplicate: ['color', 'name'],
        transaction,
      })
    );
    expect(partPropertyBulkCreateMock).toHaveBeenNthCalledWith(
      2,
      [
        {
          partId: 1,
          side: 'back',
          name: 'BackName',
        },
      ],
      expect.objectContaining({
        fields: ['partId', 'side', 'name'],
        updateOnDuplicate: ['name'],
        transaction,
      })
    );

    const firstFindAllOptions = partFindAllMock.mock.calls[0][0];
    expect(firstFindAllOptions.attributes).toEqual(['id']);
    expect(firstFindAllOptions.where.prototypeId).toBe('proto1');
    const [opInSymbol] = Object.getOwnPropertySymbols(
      firstFindAllOptions.where.id
    );
    expect(opInSymbol).toBeDefined();
    expect(firstFindAllOptions.where.id[opInSymbol]).toEqual([1, 2, 3]);
    expect(firstFindAllOptions.transaction).toBe(transaction);

    const secondFindAllOptions = partFindAllMock.mock.calls[1][0];
    expect(secondFindAllOptions.where).toEqual({
      id: [1, 2],
      prototypeId: 'proto1',
    });

    const firstPropertyFindOptions = partPropertyFindAllMock.mock.calls[0][0];
    expect(firstPropertyFindOptions.attributes).toEqual(['partId', 'side']);
    expect(firstPropertyFindOptions.transaction).toBe(transaction);

    const secondPropertyFindOptions = partPropertyFindAllMock.mock.calls[1][0];
    expect(secondPropertyFindOptions.where).toEqual({ partId: [1] });

    const prototypeEmitter = emitters['proto1'];
    expect(prototypeEmitter).toHaveBeenCalledWith(
      PROTOTYPE_SOCKET_EVENT.UPDATE_PARTS,
      {
        parts: [
          { id: 1, width: 100, height: 200 },
          { id: 2, order: 10 },
        ],
        properties: [
          { partId: 1, side: 'front', name: 'Card', color: '#fff' },
          { partId: 1, side: 'back', name: 'BackName' },
        ],
      }
    );
  });
});

describe('prototypeHandler update part', () => {
  it('updates a single part and its properties within a transaction', async () => {
    const handlers: Record<string, any> = {};
    const socket = {
      id: 'socket1',
      data: { prototypeId: 'proto1', userId: 'user1', username: 'Alice' },
      on: vi.fn((event: string, handler: any) => {
        handlers[event] = handler;
      }),
      emit: vi.fn(),
    } as any;

    const emitters: Record<string, any> = {};
    const io = {
      to: vi.fn((room: string) => {
        const emit = vi.fn();
        emitters[room] = emit;
        return { emit };
      }),
    } as any;

    const transaction = {
      commit: vi.fn().mockResolvedValue(undefined),
      rollback: vi.fn().mockResolvedValue(undefined),
    };
    partTransactionMock.mockResolvedValue(transaction);

    partFindOneMock.mockResolvedValue({ id: 1 });
    partUpdateMock.mockResolvedValue([
      1,
      [{ dataValues: { id: 1, width: 200 } }],
    ]);

    partPropertyFindAllMock
      .mockResolvedValueOnce([{ side: 'front' }])
      .mockResolvedValueOnce([
        { partId: 1, side: 'front', name: 'Updated', color: '#000' },
      ] as any);

    partPropertyBulkCreateMock.mockResolvedValue([]);

    handlePrototype(socket, io);

    await handlers[PROTOTYPE_SOCKET_EVENT.UPDATE_PART]({
      partId: 1,
      updatePart: { width: 200, ignored: 'value' },
      updateProperties: [
        { side: 'front', name: 'Updated', color: '#000', id: 123 },
        { side: 'back', name: 'Skip' },
      ],
    });

    expect(partTransactionMock).toHaveBeenCalledTimes(1);
    expect(transaction.commit).toHaveBeenCalledTimes(1);
    expect(transaction.rollback).not.toHaveBeenCalled();

    expect(partBulkCreateMock).not.toHaveBeenCalled();
    expect(partFindAllMock).not.toHaveBeenCalled();
    expect(partFindOneMock).toHaveBeenCalledWith({
      attributes: ['id'],
      where: { id: 1, prototypeId: 'proto1' },
      transaction,
    });

    expect(partUpdateMock).toHaveBeenCalledWith(
      { width: 200 },
      expect.objectContaining({
        where: { id: 1, prototypeId: 'proto1' },
        transaction,
      })
    );

    expect(partPropertyBulkCreateMock).toHaveBeenCalledTimes(1);
    expect(partPropertyBulkCreateMock).toHaveBeenCalledWith(
      [
        {
          partId: 1,
          side: 'front',
          color: '#000',
          name: 'Updated',
        },
      ],
      expect.objectContaining({
        fields: ['partId', 'side', 'color', 'name'],
        updateOnDuplicate: ['color', 'name'],
        transaction,
      })
    );

    const prototypeEmitter = emitters['proto1'];
    expect(prototypeEmitter).toHaveBeenCalledWith(
      PROTOTYPE_SOCKET_EVENT.UPDATE_PARTS,
      {
        parts: [{ id: 1, width: 200 }],
        properties: [
          { partId: 1, side: 'front', name: 'Updated', color: '#000' },
        ],
      }
    );
  });
});
