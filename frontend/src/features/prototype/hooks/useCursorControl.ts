import Konva from 'konva';
import { useCallback } from 'react';

/**
 * Konvaキャンバス上でのカーソル制御を管理するhooks
 * @param isDraggable - 要素がドラッグ可能かどうか
 */
export const useCursorControl = (isDraggable: boolean) => {
  /**
   * ドラッグ可能な状態に基づいてカーソルの種類を決定する
   * @returns カーソルの種類（'grab' または 'not-allowed'）
   */
  const getCursorType = useCallback(() => {
    return isDraggable ? 'grab' : 'not-allowed';
  }, [isDraggable]);

  /**
   * 指定されたStageにカーソルを設定する
   * @param stage - KonvaのStageオブジェクト
   * @param cursorType - 設定するカーソルの種類
   */
  const setCursor = useCallback(
    (stage: Konva.Stage | null, cursorType: string) => {
      if (stage) {
        const container = stage.container();
        if (container) {
          container.style.cursor = cursorType;
        }
      }
    },
    []
  );

  /**
   * ドラッグ可能状態に応じたカーソルを設定する
   * @param stage - KonvaのStageオブジェクト
   */
  const setDraggableCursor = useCallback(
    (stage: Konva.Stage | null) => {
      setCursor(stage, getCursorType());
    },
    [setCursor, getCursorType]
  );

  /**
   * ドラッグ中のカーソルを設定する
   * @param stage - KonvaのStageオブジェクト
   */
  const setGrabbingCursor = useCallback(
    (stage: Konva.Stage | null) => {
      setCursor(stage, 'grabbing');
    },
    [setCursor]
  );

  /**
   * デフォルトカーソルを設定する
   * @param stage - KonvaのStageオブジェクト
   */
  const setDefaultCursor = useCallback(
    (stage: Konva.Stage | null) => {
      setCursor(stage, 'default');
    },
    [setCursor]
  );

  return {
    getCursorType,
    setCursor,
    setDraggableCursor,
    setGrabbingCursor,
    setDefaultCursor,
  };
};
