import { useEffect } from 'react';

import { KEYBOARD_SHORTCUTS } from '@/features/prototype/constants';
import { GameBoardMode } from '@/features/prototype/types';
import { isInputFieldFocused } from '@/utils/inputFocus';

/** Delete/Backspaceで選択中パーツを削除（CREATEモードのみ） */
/**
 * 汎用のゲームボードショートカットフック
 * - Delete / Backspace: 選択パーツを削除（CREATEモード）
 * - Cmd または Ctrl + d: 選択パーツを複製（CREATEモード）
 */
export function useGameBoardShortcuts(
  handleDeleteParts: () => Promise<void> | void,
  handleDuplicatePart: () => Promise<void> | void,
  gameBoardMode: GameBoardMode
) {
  useEffect(() => {
    // CREATEモードのみ有効
    if (gameBoardMode !== GameBoardMode.CREATE) return;

    // 再入防止用 ref
    const isDeletingRef = { current: false } as { current: boolean };
    const isCopyingRef = { current: false } as { current: boolean };

    const onKeyDown = (e: KeyboardEvent) => {
      // 自動リピートを無視
      if (e.repeat) return;

      // 入力中は無視
      if (isInputFieldFocused()) return;

      // --- 削除処理 ---
      if (KEYBOARD_SHORTCUTS.deleteParts.match?.(e)) {
        e.preventDefault();
        if (isDeletingRef.current) return;

        void (async () => {
          isDeletingRef.current = true;
          try {
            await handleDeleteParts();
          } catch (err) {
            console.error(
              'useGameBoardShortcuts: パーツ削除に失敗しました',
              err
            );
          } finally {
            isDeletingRef.current = false;
          }
        })();

        return;
      }

      // --- 複製処理 ---
      if (KEYBOARD_SHORTCUTS.duplicatePart.match?.(e)) {
        // ハンドラが未定義なら無視
        if (!handleDuplicatePart) return;

        e.preventDefault();
        if (isCopyingRef.current) return;

        void (async () => {
          isCopyingRef.current = true;
          try {
            await handleDuplicatePart();
          } catch (err) {
            console.error(
              'useGameBoardShortcuts: パーツ複製に失敗しました',
              err
            );
          } finally {
            isCopyingRef.current = false;
          }
        })();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handleDeleteParts, handleDuplicatePart, gameBoardMode]);
}
