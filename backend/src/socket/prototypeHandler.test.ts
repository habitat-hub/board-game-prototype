/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../models/Part', () => ({
  default: {},
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

import handlePrototype, { connectedUsersMap } from './prototypeHandler';
import PrototypeModel from '../models/Prototype';
import { COMMON_SOCKET_EVENT, PROJECT_SOCKET_EVENT } from '../constants/socket';

const mockedFindByPk = PrototypeModel.findByPk as unknown as ReturnType<
  typeof vi.fn
>;

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
