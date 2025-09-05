import { renderHook, act } from '@testing-library/react';
import { Socket } from 'socket.io-client';
import { vi, type Mock } from 'vitest';

import { PartProperty } from '@/api/types';
import {
  COMMON_SOCKET_EVENT,
  PROTOTYPE_SOCKET_EVENT,
  SOCKET_DISCONNECT_REASON,
} from '@/features/prototype/constants/socket';
import { usePrototypeSocket } from '@/features/prototype/hooks/usePrototypeSocket';
import { ConnectedUser } from '@/features/prototype/types/livePrototypeInformation';

// Socket.ioのイベントコールバックの型定義
type SocketEventCall = [string, (...args: unknown[]) => void];

// モック関数の呼び出し履歴からイベントコールバックを取得するヘルパー
const getEventCallback = (mockOn: Mock, eventName: string) => {
  const calls = mockOn.mock.calls as SocketEventCall[];
  const call = calls.find((call) => call[0] === eventName);
  return call?.[1];
};

// モック設定
const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
} as unknown as Socket;

const mockSelectMultipleParts = vi.fn();
let mockSelectedPartIds: number[] = [];

// useSocketのモック
vi.mock('@/features/prototype/contexts/SocketContext', () => ({
  useSocket: () => ({ socket: mockSocket }),
}));

// useSelectedPartsのモック
vi.mock('@/features/prototype/contexts/SelectedPartsContext', () => ({
  useSelectedParts: () => ({
    selectMultipleParts: mockSelectMultipleParts,
    selectedPartIds: mockSelectedPartIds,
  }),
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

describe('usePrototypeSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // モック関数の呼び出し履歴をクリア
    (mockSocket.on as Mock).mockClear();
    (mockSocket.off as Mock).mockClear();
    (mockSocket.emit as Mock).mockClear();
    (mockSocket.connect as Mock).mockClear();
    mockSelectMultipleParts.mockClear();
    mockSelectedPartIds = [];
  });

  const defaultProps = {
    prototypeId: 'test-prototype-id',
    userId: 'test-user-id',
  };

  describe('エラーハンドリング', () => {
    it('connect_errorが発生した際にログを出力して再接続が試行される', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      renderHook(() => usePrototypeSocket(defaultProps));

      const connectErrorCallback = getEventCallback(
        mockSocket.on as Mock,
        COMMON_SOCKET_EVENT.CONNECT_ERROR
      );

      const testError = new Error('Connection failed');
      connectErrorCallback!(testError);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Socket接続エラーが発生しました:',
        testError
      );
      expect(mockSocket.connect).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });

    it('想定外のdisconnect理由ではアラートが表示される', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      renderHook(() => usePrototypeSocket(defaultProps));

      const disconnectCallback = getEventCallback(
        mockSocket.on as Mock,
        COMMON_SOCKET_EVENT.DISCONNECT
      );

      disconnectCallback!(SOCKET_DISCONNECT_REASON.TRANSPORT_ERROR);

      expect(alertSpy).toHaveBeenCalledWith(
        '接続が切断されました。ページを再読み込みしてください。'
      );
      expect(mockSocket.connect).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('クライアント都合のdisconnectではアラートが表示されない', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      renderHook(() => usePrototypeSocket(defaultProps));

      const disconnectCallback = getEventCallback(
        mockSocket.on as Mock,
        COMMON_SOCKET_EVENT.DISCONNECT
      );

      // クライアントが明示的に切断したケース
      disconnectCallback!('io client disconnect');

      expect(alertSpy).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });

  describe('基本機能', () => {
    it('JOIN_PROTOTYPEイベントが正しく送信される', () => {
      renderHook(() => usePrototypeSocket(defaultProps));

      expect(mockSocket.emit).toHaveBeenCalledWith(
        PROTOTYPE_SOCKET_EVENT.JOIN_PROTOTYPE,
        {
          prototypeId: 'test-prototype-id',
          userId: 'test-user-id',
        }
      );
    });

    it('クリーンアップ時にイベントリスナーが削除される', () => {
      const { unmount } = renderHook(() => usePrototypeSocket(defaultProps));

      unmount();

      const expectedOffEvents = [
        COMMON_SOCKET_EVENT.CONNECT_ERROR,
        COMMON_SOCKET_EVENT.DISCONNECTING,
        COMMON_SOCKET_EVENT.DISCONNECT,
        PROTOTYPE_SOCKET_EVENT.INITIAL_PARTS,
        PROTOTYPE_SOCKET_EVENT.ADD_PART,
        PROTOTYPE_SOCKET_EVENT.ADD_PART_RESPONSE,
        PROTOTYPE_SOCKET_EVENT.UPDATE_PARTS,
        PROTOTYPE_SOCKET_EVENT.DELETE_PARTS,
        PROTOTYPE_SOCKET_EVENT.CONNECTED_USERS,
        PROTOTYPE_SOCKET_EVENT.SELECTED_PARTS,
      ];

      expectedOffEvents.forEach((eventName) => {
        expect(mockSocket.off).toHaveBeenCalledWith(eventName);
      });
    });

    it('selectedPartIds変更時にSELECTED_PARTSイベントが送信される', () => {
      const { rerender } = renderHook(() => usePrototypeSocket(defaultProps));
      (mockSocket.emit as Mock).mockClear();
      mockSelectedPartIds = [1, 2];
      rerender();
      expect(mockSocket.emit).toHaveBeenCalledWith(
        PROTOTYPE_SOCKET_EVENT.SELECTED_PARTS,
        { selectedPartIds: [1, 2] }
      );
    });
  });

  describe('データハンドリング', () => {
    it('INITIAL_PARTSイベントでpartsMapとpropertiesMapが正しく設定される', () => {
      const { result } = renderHook(() => usePrototypeSocket(defaultProps));

      const initialPartsCallback = getEventCallback(
        mockSocket.on as Mock,
        PROTOTYPE_SOCKET_EVENT.INITIAL_PARTS
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
      const { result } = renderHook(() => usePrototypeSocket(defaultProps));

      const addPartCallback = getEventCallback(
        mockSocket.on as Mock,
        PROTOTYPE_SOCKET_EVENT.ADD_PART
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

    it('DELETE_PARTSイベントでpartsMapとpropertiesMapから該当アイテムが削除される', () => {
      const { result } = renderHook(() => usePrototypeSocket(defaultProps));

      // 初期データを設定
      const initialPartsCallback = getEventCallback(
        mockSocket.on as Mock,
        PROTOTYPE_SOCKET_EVENT.INITIAL_PARTS
      );
      const mockParts = [
        { id: 1, name: 'Part 1', x: 100, y: 200 },
        { id: 2, name: 'Part 2', x: 300, y: 400 },
        { id: 3, name: 'Part 3', x: 500, y: 600 },
      ];
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
        mockSocket.on as Mock,
        PROTOTYPE_SOCKET_EVENT.DELETE_PARTS
      );

      act(() => {
        deletePartCallback!({ partIds: [1, 2] });
      });

      expect(result.current.partsMap.has(1)).toBe(false);
      expect(result.current.partsMap.has(2)).toBe(false);
      expect(result.current.propertiesMap.has(1)).toBe(false);
      expect(result.current.propertiesMap.has(2)).toBe(false);
    });

    it('UPDATE_PARTSイベントで同じpartIdの同じsideのプロパティが上書きされる', () => {
      const { result } = renderHook(() => usePrototypeSocket(defaultProps));

      // 初期データを設定（front, backの両方があるパーツ）
      const initialPartsCallback = getEventCallback(
        mockSocket.on as Mock,
        PROTOTYPE_SOCKET_EVENT.INITIAL_PARTS
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
        mockSocket.on as Mock,
        PROTOTYPE_SOCKET_EVENT.UPDATE_PARTS
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
      renderHook(() => usePrototypeSocket(defaultProps));

      const addPartResponseCallback = getEventCallback(
        mockSocket.on as Mock,
        PROTOTYPE_SOCKET_EVENT.ADD_PART_RESPONSE
      );

      addPartResponseCallback!({ partId: 123 });

      expect(mockSelectMultipleParts).toHaveBeenCalledWith([123]);
    });

    it('CONNECTED_USERSイベントで接続中ユーザーリストが正しく更新される', () => {
      const { result } = renderHook(() => usePrototypeSocket(defaultProps));

      const connectedUsersCallback = getEventCallback(
        mockSocket.on as Mock,
        PROTOTYPE_SOCKET_EVENT.CONNECTED_USERS
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

    it('SELECTED_PARTSイベントでselectedUsersByPartが更新される', () => {
      const { result } = renderHook(() => usePrototypeSocket(defaultProps));

      const selectedPartsCallback = getEventCallback(
        mockSocket.on as Mock,
        PROTOTYPE_SOCKET_EVENT.SELECTED_PARTS
      );

      act(() => {
        selectedPartsCallback!({
          userId: 'other',
          username: 'Other User',
          selectedPartIds: [5],
        });
      });

      expect(result.current.selectedUsersByPart[5]).toEqual([
        { userId: 'other', username: 'Other User' },
      ]);
    });

    it('一定時間更新が無い選択は自動的にクリアされる', () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => usePrototypeSocket(defaultProps));

      const selectedPartsCallback = getEventCallback(
        mockSocket.on as Mock,
        PROTOTYPE_SOCKET_EVENT.SELECTED_PARTS
      );

      act(() => {
        selectedPartsCallback!({
          userId: 'other',
          username: 'Other User',
          selectedPartIds: [5],
        });
      });

      expect(result.current.selectedUsersByPart[5]).toBeDefined();

      act(() => {
        vi.advanceTimersByTime(1600);
      });

      expect(result.current.selectedUsersByPart[5]).toBeUndefined();
      vi.useRealTimers();
    });
  });
});
