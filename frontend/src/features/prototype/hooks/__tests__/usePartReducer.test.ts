import { renderHook, act } from '@testing-library/react';
import { Socket } from 'socket.io-client';
import { vi, type Mock } from 'vitest';

import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';

// モック設定
const mockSocket = {
  emit: vi.fn(),
} as unknown as Socket;

// useSocketのモック
vi.mock('@/features/prototype/contexts/SocketContext', () => ({
  useSocket: () => ({ socket: mockSocket }),
}));

// usePerformanceTrackerのモック
vi.mock('@/features/prototype/hooks/usePerformanceTracker', () => ({
  usePerformanceTracker: () => ({
    measureOperation: (_: string, fn: () => void) => fn(),
  }),
}));

describe('usePartReducer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mockSocket.emit as Mock).mockClear();
  });

  it('UPDATE_PARTSアクションでソケットにイベントがemitされる', () => {
    const { result } = renderHook(() => usePartReducer());

    const updates = [
      { partId: 1, updatePart: { position: { x: 10, y: 20 } } },
      {
        partId: 2,
        updateProperties: [{ side: 'front' as const, name: 'name' }],
      },
    ];

    act(() => {
      result.current.dispatch({
        type: 'UPDATE_PARTS',
        payload: { updates },
      });
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('UPDATE_PARTS', { updates });
  });
});
