/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { bulkCreateMock } = vi.hoisted(() => ({
  bulkCreateMock: vi.fn(),
}));

vi.mock('../models/Part', () => ({
  default: {
    bulkCreate: bulkCreateMock,
  },
}));
vi.mock('../models/PartProperty', () => ({
  default: {},
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

describe('rebalanceOrders', () => {
  beforeEach(() => {
    bulkCreateMock.mockReset();
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

    bulkCreateMock.mockResolvedValue([]);

    const partModels = parts as unknown as PartModel[];
    const result = await rebalanceOrders(prototypeId, partModels, io);

    expect(bulkCreateMock).toHaveBeenCalledTimes(1);
    const [records, options] = bulkCreateMock.mock.calls[0];
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
  beforeEach(() => {
    mockedFindByPk.mockReset();
    for (const key in connectedUsersMap) {
      delete connectedUsersMap[key];
    }
  });

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
