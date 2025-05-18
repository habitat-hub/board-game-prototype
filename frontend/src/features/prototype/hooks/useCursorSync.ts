import { throttle } from 'lodash';
import { useRef, useEffect, useMemo } from 'react';
import { Socket } from 'socket.io-client';

import { UserListData } from '@/api/types';

interface UseCursorSyncProps {
  containerRef: React.RefObject<HTMLDivElement>;
  socket: Socket;
  user: UserListData | null;
}

/**
 * カーソル位置の同期を管理するカスタムフック
 *
 * @param containerRef マウス位置計算の基準となる要素への参照
 * @param socket ソケット接続インスタンス
 * @param user 現在のユーザー情報
 */
export const useCursorSync = ({
  containerRef,
  socket,
  user,
}: UseCursorSyncProps) => {
  // 前回のカーソル位置を保持するためのref
  const lastCursorPosition = useRef<{ x: number; y: number } | null>(null);

  // マウス移動イベントハンドラ - スロットリング処理付き
  const throttledMouseMove = useMemo(
    () =>
      throttle((e: MouseEvent) => {
        if (!containerRef.current || !user) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 前回の位置と現在の位置が20px以内なら更新しない（パフォーマンス最適化）
        const lastPosition = lastCursorPosition.current;
        if (
          lastPosition &&
          Math.abs(lastPosition.x - x) <= 20 &&
          Math.abs(lastPosition.y - y) <= 20
        ) {
          return;
        }

        lastCursorPosition.current = { x, y };
        socket.emit('UPDATE_CURSOR', {
          userId: user.id || '',
          userName: user.username || 'unknown',
          position: { x, y },
        });
      }, 100),
    [socket, user, containerRef]
  );

  // イベントリスナーの設定と解除
  useEffect(() => {
    window.addEventListener('mousemove', throttledMouseMove);

    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
      throttledMouseMove.cancel();
    };
  }, [throttledMouseMove]);

  return {
    // 必要に応じて追加のメソッドやステートをここに公開できます
  };
};
