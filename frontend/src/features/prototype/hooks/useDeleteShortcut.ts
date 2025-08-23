import { useEffect } from 'react';

import { GameBoardMode } from '@/features/prototype/types';
import { isInputFieldFocused } from '@/utils/inputFocus';

/** Delete/Backspaceで選択中パーツを削除（CREATEモードのみ） */
export function useDeleteShortcut(
  handleDeletePart: () => Promise<void> | void,
  gameBoardMode: GameBoardMode
) {
  useEffect(() => {
    // CREATEモードのみ有効
    if (gameBoardMode !== GameBoardMode.CREATE) return;

    // 既に削除処理が走っている場合の再入防止
    const isDeletingRef = { current: false } as { current: boolean };

    const onKeyDown = (e: KeyboardEvent) => {
      // Delete / Backspace のみ処理する
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;

      // 自動リピートを無視
      if (e.repeat) return;

      // 修飾キー併用は無視
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      // 入力中は無視
      if (isInputFieldFocused()) return;

      e.preventDefault();

      // 既に削除処理が実行中なら無視
      if (isDeletingRef.current) return;

      void (async () => {
        isDeletingRef.current = true;
        try {
          await handleDeletePart();
        } catch (err) {
          console.error('useDeleteShortcut: パーツ削除に失敗しました', err);
        } finally {
          isDeletingRef.current = false;
        }
      })();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handleDeletePart, gameBoardMode]);
}

export default useDeleteShortcut;
