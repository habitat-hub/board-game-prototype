/**
 * @page ドラッグによる複数選択機能を管理するカスタムフック
 */
import type { KonvaEventObject } from 'konva/lib/Node';
import { useCallback, useMemo, useRef, useState } from 'react';

import { Part } from '@/api/types';
import { isRectOverlap } from '@/features/prototype/utils/overlap';

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

interface Camera {
  x: number;
  y: number;
  scale: number;
}

export function useSelection() {
  // 複数選択可能モード
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(true);
  // 複数選択用の矩形
  const [rectForSelection, setRectForSelection] = useState<SelectionRect>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: false,
  });
  // 選択開始座標
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  // 選択終了フラグ
  const justFinishedSelectionRef = useRef<boolean>(false);

  // Stage座標→カメラ考慮のキャンバス座標に変換
  const convertToCanvasCoords = useCallback(
    (stageX: number, stageY: number, camera: Camera) => {
      return {
        x: (stageX + camera.x) / camera.scale,
        y: (stageY + camera.y) / camera.scale,
      };
    },
    []
  );

  // 選択開始
  const handleSelectionStart = useCallback(
    (e: KonvaEventObject<MouseEvent>, camera: Camera) => {
      if (!isSelectionMode) return;

      e.cancelBubble = true;
      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;

      const { x, y } = convertToCanvasCoords(pos.x, pos.y, camera);
      selectionStartRef.current = { x, y };
      setRectForSelection({ x, y, width: 0, height: 0, visible: true });
    },
    [isSelectionMode, convertToCanvasCoords]
  );

  // 選択中の移動
  const handleSelectionMove = useCallback(
    (e: KonvaEventObject<MouseEvent>, camera: Camera) => {
      if (!isSelectionMode || !selectionStartRef.current) return;

      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;

      const { x, y } = convertToCanvasCoords(pos.x, pos.y, camera);
      const start = selectionStartRef.current;
      const rect = {
        x: Math.min(start.x, x),
        y: Math.min(start.y, y),
        width: Math.abs(x - start.x),
        height: Math.abs(y - start.y),
        visible: true,
      };
      setRectForSelection(rect);
    },
    [isSelectionMode, convertToCanvasCoords]
  );

  // 選択終了
  const handleSelectionEnd = useCallback(
    (
      e: KonvaEventObject<MouseEvent>,
      parts: Part[],
      onPartsSelected: (partIds: number[]) => void,
      onClearSelection: () => void
    ) => {
      if (!isSelectionMode || !selectionStartRef.current) return;

      e.cancelBubble = true;

      const rect = rectForSelection;
      if (rect.width > 0 && rect.height > 0) {
        const selected = parts.filter((part) => {
          const partRect = {
            x: part.position.x,
            y: part.position.y,
            width: part.width,
            height: part.height,
          };
          return isRectOverlap(rect, partRect);
        });
        const newSelectedIds = selected.map((p) => p.id);
        onPartsSelected(newSelectedIds);
        justFinishedSelectionRef.current = true;
      } else {
        onClearSelection();
        justFinishedSelectionRef.current = false;
      }

      setRectForSelection((r) => ({ ...r, visible: false }));
      selectionStartRef.current = null;
    },
    [isSelectionMode, rectForSelection]
  );

  const toggleMode = useCallback(() => {
    setIsSelectionMode((prev) => !prev);
  }, []);

  const isJustFinishedSelection = useMemo(() => {
    const result = justFinishedSelectionRef.current;
    if (result) {
      justFinishedSelectionRef.current = false;
    }
    return result;
  }, []);

  return {
    isSelectionMode,
    rectForSelection,
    isSelectionInProgress: selectionStartRef.current !== null,
    isJustFinishedSelection,
    handleSelectionStart,
    handleSelectionMove,
    handleSelectionEnd,
    toggleMode,
  };
}
