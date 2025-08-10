/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { Socket } from 'socket.io-client';

import { PartProperty } from '@/api/types';
import { SOCKET_EVENT } from '@/features/prototype/constants/socket';
import { useSocketConnection } from '@/features/prototype/hooks/useSocketConnection';
import { ConnectedUser } from '@/features/prototype/types/livePrototypeInformation';

// Socket.ioのイベントコールバックの型定義
type SocketEventCall = [string, (...args: unknown[]) => void];

// モック関数の呼び出し履歴からイベントコールバックを取得するヘルパー
const getEventCallback = (mockOn: jest.Mock, eventName: string) => {
  const calls = mockOn.mock.calls as SocketEventCall[];
  const call = calls.find((call) => call[0] === eventName);
  return call?.[1];
};

// モック設定
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
} as unknown as Socket;

const mockSelectMultipleParts = jest.fn();

// useSocketのモック
jest.mock('@/features/prototype/contexts/SocketContext', () => ({
  useSocket: () => ({ socket: mockSocket }),
}));

// useSelectedPartsのモック
jest.mock('@/features/prototype/contexts/SelectedPartsContext', () => ({
  useSelectedParts: () => ({ selectMultipleParts: mockSelectMultipleParts }),
}));

// テスト用のPartPropertyを作成するヘルパー関数
const createMockPartProperty = (
  overrides: Partial<PartProperty> = {}
): PartProperty => ({
  partId: 1,
  side: 'front' as const,
  name: 'Test Property',
  description: 'Test Description',
  color: '#000000',
  textColor: '#ffffff',
  imageId: null,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  ...overrides,
});

describe('useSocketConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // モック関数の呼び出し履歴をクリア
    (mockSocket.on as jest.Mock).mockClear();
    (mockSocket.off as jest.Mock).mockClear();
    (mockSocket.emit as jest.Mock).mockClear();
    (mockSocket.connect as jest.Mock).mockClear();
    mockSelectMultipleParts.mockClear();
  });

  const defaultProps = {
    prototypeId: 'test-prototype-id',
    userId: 'test-user-id',
  };

  describe('エラーハンドリング', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('connect_errorが発生した際にログを出力して再接続が試行される', () => {
      renderHook(() => useSocketConnection(defaultProps));

      const connectErrorCallback = getEventCallback(
        mockSocket.on as jest.Mock,
        'connect_error'
      );

      const testError = new Error('Connection failed');
      connectErrorCallback!(testError);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Socket接続エラーが発生しました:',
        testError
      );
      expect(mockSocket.connect).toHaveBeenCalledTimes(1);
    });

    it('disconnectイベントでログを出力して再接続が適切に処理される', () => {
      renderHook(() => useSocketConnection(defaultProps));

      const disconnectCallback = getEventCallback(
        mockSocket.on as jest.Mock,
        'disconnect'
      );

      // サーバー側の切断では再接続
      disconnectCallback!('io server disconnect');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Socket接続が予期せず切断されました:',
        {
          reason: 'io server disconnect',
        }
      );
      expect(mockSocket.connect).toHaveBeenCalledTimes(1);

      // クライアント側の切断では再接続しない
      jest.clearAllMocks();
      consoleSpy.mockClear();
      disconnectCallback!('io client disconnect');
      expect(consoleSpy).not.toHaveBeenCalled();
      expect(mockSocket.connect).not.toHaveBeenCalled();
    });
  });

  describe('基本機能', () => {
    it('JOIN_PROTOTYPEイベントが正しく送信される', () => {
      renderHook(() => useSocketConnection(defaultProps));

      expect(mockSocket.emit).toHaveBeenCalledWith('JOIN_PROTOTYPE', {
        prototypeId: 'test-prototype-id',
        userId: 'test-user-id',
      });
    });

    it('クリーンアップ時にイベントリスナーが削除される', () => {
      const { unmount } = renderHook(() => useSocketConnection(defaultProps));

      unmount();

      const expectedOffEvents = [
        'connect_error',
        'disconnect',
        SOCKET_EVENT.INITIAL_PARTS,
        SOCKET_EVENT.ADD_PART,
        SOCKET_EVENT.ADD_PART_RESPONSE,
        SOCKET_EVENT.UPDATE_PARTS,
        SOCKET_EVENT.DELETE_PART,
        'UPDATE_CURSORS',
      ];

      expectedOffEvents.forEach((eventName) => {
        expect(mockSocket.off).toHaveBeenCalledWith(eventName);
      });
    });
  });

  describe('データハンドリング', () => {
    it('INITIAL_PARTSイベントでpartsMapとpropertiesMapが正しく設定される', () => {
      const { result } = renderHook(() => useSocketConnection(defaultProps));

      const initialPartsCallback = getEventCallback(
        mockSocket.on as jest.Mock,
        SOCKET_EVENT.INITIAL_PARTS
      );

      const mockParts = [
        { id: 1, name: 'Part 1', x: 100, y: 200 },
        { id: 2, name: 'Part 2', x: 300, y: 400 },
      ];
      const mockProperties = [
        createMockPartProperty({
          partId: 1,
          side: 'front',
          name: 'Front text',
        }),
        createMockPartProperty({
          partId: 2,
          side: 'back',
          name: 'Back text',
        }),
      ];

      act(() => {
        initialPartsCallback!({ parts: mockParts, properties: mockProperties });
      });

      expect(result.current.partsMap.get(1)).toEqual(mockParts[0]);
      expect(result.current.partsMap.get(2)).toEqual(mockParts[1]);
      expect(result.current.propertiesMap.get(1)).toEqual([mockProperties[0]]);
      expect(result.current.propertiesMap.get(2)).toEqual([mockProperties[1]]);
    });

    it('ADD_PARTイベントでpartsMapとpropertiesMapが正しく更新される', () => {
      const { result } = renderHook(() => useSocketConnection(defaultProps));

      const addPartCallback = getEventCallback(
        mockSocket.on as jest.Mock,
        SOCKET_EVENT.ADD_PART
      );

      const mockPart = { id: 3, name: 'New Part', x: 500, y: 600 };
      const mockProperties = [
        createMockPartProperty({
          partId: 3,
          side: 'front',
          name: 'New front text',
        }),
      ];

      act(() => {
        addPartCallback!({ part: mockPart, properties: mockProperties });
      });

      expect(result.current.partsMap.get(3)).toEqual(mockPart);
      expect(result.current.propertiesMap.get(3)).toEqual(mockProperties);
    });

    it('DELETE_PARTイベントでpartsMapとpropertiesMapから該当アイテムが削除される', () => {
      const { result } = renderHook(() => useSocketConnection(defaultProps));

      // 初期データを設定
      const initialPartsCallback = getEventCallback(
        mockSocket.on as jest.Mock,
        SOCKET_EVENT.INITIAL_PARTS
      );
      const mockParts = [{ id: 1, name: 'Part 1', x: 100, y: 200 }];
      const mockProperties = [
        createMockPartProperty({
          partId: 1,
          side: 'front',
          name: 'Front text',
        }),
      ];

      act(() => {
        initialPartsCallback!({ parts: mockParts, properties: mockProperties });
      });

      const deletePartCallback = getEventCallback(
        mockSocket.on as jest.Mock,
        SOCKET_EVENT.DELETE_PART
      );

      act(() => {
        deletePartCallback!({ partId: 1 });
      });

      expect(result.current.partsMap.has(1)).toBe(false);
      expect(result.current.propertiesMap.has(1)).toBe(false);
    });

    it('UPDATE_PARTSイベントで同じpartIdの同じsideのプロパティが上書きされる', () => {
      const { result } = renderHook(() => useSocketConnection(defaultProps));

      // 初期データを設定（front, backの両方があるパーツ）
      const initialPartsCallback = getEventCallback(
        mockSocket.on as jest.Mock,
        SOCKET_EVENT.INITIAL_PARTS
      );
      const initialParts = [{ id: 1, name: 'Part 1', x: 100, y: 200 }];
      const initialProperties = [
        createMockPartProperty({
          partId: 1,
          side: 'front',
          name: 'Old front text',
        }),
        createMockPartProperty({
          partId: 1,
          side: 'back',
          name: 'Old back text',
        }),
      ];

      act(() => {
        initialPartsCallback!({
          parts: initialParts,
          properties: initialProperties,
        });
      });

      const updatePartsCallback = getEventCallback(
        mockSocket.on as jest.Mock,
        SOCKET_EVENT.UPDATE_PARTS
      );

      // frontのみを更新
      const updatedParts = [{ id: 1, name: 'Part 1', x: 100, y: 200 }];
      const updatedProperties = [
        createMockPartProperty({
          partId: 1,
          side: 'front',
          name: 'Updated front text',
        }),
      ];

      act(() => {
        updatePartsCallback!({
          parts: updatedParts,
          properties: updatedProperties,
        });
      });

      // frontが上書きされ、backは残ることを確認
      const properties = result.current.propertiesMap.get(1);
      expect(properties).toHaveLength(2);
      expect(properties?.find((p) => p.side === 'front')?.name).toBe(
        'Updated front text'
      );
      expect(properties?.find((p) => p.side === 'back')?.name).toBe(
        'Old back text'
      );
    });

    it('ADD_PART_RESPONSEイベントで選択が正しく実行される', () => {
      renderHook(() => useSocketConnection(defaultProps));

      const addPartResponseCallback = getEventCallback(
        mockSocket.on as jest.Mock,
        SOCKET_EVENT.ADD_PART_RESPONSE
      );

      addPartResponseCallback!({ partId: 123 });

      expect(mockSelectMultipleParts).toHaveBeenCalledWith([123]);
    });

    it('CONNECTED_USERSイベントで接続中ユーザーリストが正しく更新される', () => {
      const { result } = renderHook(() => useSocketConnection(defaultProps));

      const connectedUsersCallback = getEventCallback(
        mockSocket.on as jest.Mock,
        SOCKET_EVENT.CONNECTED_USERS
      );

      const mockUsers: ConnectedUser[] = [
        { userId: 'user1', username: 'User One' },
        { userId: 'user2', username: 'User Two' },
      ];

      act(() => {
        connectedUsersCallback!({ users: mockUsers });
      });

      expect(result.current.connectedUsers).toEqual(mockUsers);
    });
  });
});
