import { useEffect } from 'react';

import { GameBoardMode } from '@/features/prototype/types';
import { isInputFieldFocused } from '@/utils/inputFocus';

/**
 * Delete / Backspace 押下で選択中のパーツを削除するショートカットを提供するフック
 * - CREATEモード時のみ有効
 */
export function useDeleteShortcut(
  handleDeletePart: () => Promise<void> | void,
  gameBoardMode: GameBoardMode
) {
  useEffect(() => {
    if (gameBoardMode !== GameBoardMode.CREATE) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      if (isInputFieldFocused()) return;

      e.preventDefault();
      void handleDeletePart();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handleDeletePart, gameBoardMode]);
}

export default useDeleteShortcut;
