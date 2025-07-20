import Konva from 'konva';
import { useCallback, useRef } from 'react';

import { Part } from '@/api/types';
import { useSelectedParts } from '@/features/prototype/contexts/SelectedPartsContext';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import { usePerformanceTracker } from '@/features/prototype/hooks/usePerformanceTracker';
import { GameBoardMode } from '@/features/prototype/types';

/**
 * パーツドラッグシステムのProps型定義
 */
interface UsePartDragSystemProps {
  // パーツ
  parts: Part[];
  // キャンバスサイズ
  canvasSize: { width: number; height: number };
  // ゲームボードモード
  gameBoardMode: GameBoardMode;
  // ステージのref
  stageRef: React.RefObject<Konva.Stage>;
}

/**
 * パーツドラッグシステムの統合フック
 */
export const usePartDragSystem = ({
  parts,
  canvasSize,
  gameBoardMode,
  stageRef,
}: UsePartDragSystemProps) => {
  const { dispatch } = usePartReducer();
  const { measureOperation } = usePerformanceTracker();
  const { selectedPartIds, selectMultipleParts } = useSelectedParts();

  // 元位置記録用ref
  const originalPositionsRef = useRef<Record<number, { x: number; y: number }>>(
    {}
  );

  /**
   * パーツの位置をキャンバス内に制限する関数
   */
  const getConstrainedPosition = useCallback(
    (
      partObject: Part,
      baseX: number,
      baseY: number,
      deltaX: number,
      deltaY: number
    ) => {
      const newX = baseX + deltaX;
      const newY = baseY + deltaY;

      return {
        x: Math.max(0, Math.min(canvasSize.width - partObject.width, newX)),
        y: Math.max(0, Math.min(canvasSize.height - partObject.height, newY)),
      };
    },
    [canvasSize.height, canvasSize.width]
  );

  /**
   * ドラッグ開始処理
   */
  const handlePartDragStart = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, partId: number) => {
      // プレビューモードの場合
      if (gameBoardMode === GameBoardMode.PREVIEW) return;
      e.cancelBubble = true;

      // 選択状態の更新
      const newSelected = selectedPartIds.includes(partId)
        ? selectedPartIds
        : [partId];
      selectMultipleParts(newSelected);

      // 元位置の記録
      const newOriginalPositions = newSelected.reduce(
        (acc, id) => {
          const part = parts.find((pt) => pt.id === id);
          return part
            ? { ...acc, [id]: { x: part.position.x, y: part.position.y } }
            : acc;
        },
        {} as Record<number, { x: number; y: number }>
      );
      originalPositionsRef.current = newOriginalPositions;
    },
    [gameBoardMode, selectedPartIds, selectMultipleParts, parts]
  );

  /**
   * ドラッグ移動処理
   */
  const handlePartDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, partId: number) => {
      const stage = stageRef.current;

      const originalPositions = originalPositionsRef.current;
      const partOriginalPosition = originalPositions[partId];

      // 元位置、ステージが存在しない場合
      if (!partOriginalPosition || !stage) return;

      const targetPart = parts.find((p) => p.id === partId);
      // パーツが存在しない場合
      if (!targetPart) return;

      const partCurrentPosition = e.target.position();
      const offsetX = targetPart.width / 2;

      // 元の移動量（制約前）
      const originalDx =
        partCurrentPosition.x - offsetX - partOriginalPosition.x;
      const originalDy = partCurrentPosition.y - partOriginalPosition.y;

      // キャンバス内に収まるような位置情報
      const constrainedPos = getConstrainedPosition(
        targetPart,
        partOriginalPosition.x,
        partOriginalPosition.y,
        originalDx,
        originalDy
      );
      // ドラッグ中のパーツの位置更新
      e.target.position({
        x: constrainedPos.x + offsetX,
        y: constrainedPos.y,
      });

      // ドラッグ中以外の他パーツ
      const otherParts = selectedPartIds
        .filter((id) => id !== partId)
        .map((id) => ({
          id,
          node: stage.findOne(`.part-${id}`) as Konva.Node,
          origPos: originalPositions[id],
          part: parts.find((p) => p.id === id),
        }))
        .filter(({ node, origPos, part }) => node && origPos && part);

      // ドラッグ中以外の他パーツの位置更新（各パーツごとに制約を適用）
      const otherPartsWithNewPosition = otherParts.map(
        ({ node, origPos, part }) => {
          const otherOffsetX = part!.width / 2;
          // 各パーツごとに元の移動量で制約を適用
          const otherConstrainedPos = getConstrainedPosition(
            part!,
            origPos.x,
            origPos.y,
            originalDx,
            originalDy
          );
          return {
            node,
            position: {
              x: otherConstrainedPos.x + otherOffsetX,
              y: otherConstrainedPos.y,
            },
          };
        }
      );

      // 他パーツの位置更新
      otherPartsWithNewPosition.forEach(({ node, position }) => {
        node.position(position);
      });

      // 更新処理の実行
      stage.batchDraw();
    },
    [getConstrainedPosition, parts, selectedPartIds, stageRef]
  );

  /**
   * ドラッグ終了処理
   */
  const handlePartDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, partId: number) => {
      if (gameBoardMode === GameBoardMode.PREVIEW) return;

      measureOperation('Part Drag Update', () => {
        const originalPositions = originalPositionsRef.current;
        const partOriginalPosition = originalPositions[partId];
        // 元位置が存在しない場合
        if (!partOriginalPosition) return;

        const targetPart = parts.find((p) => p.id === partId);
        // パーツが存在しない場合
        if (!targetPart) return;

        const partCurrentPosition = e.target.position();
        const offsetX = targetPart.width / 2;

        // 元の移動量（制約前）
        const originalDx =
          partCurrentPosition.x - offsetX - partOriginalPosition.x;
        const originalDy = partCurrentPosition.y - partOriginalPosition.y;

        const updatePartsData = Object.entries(originalPositions).reduce(
          (acc, [idStr, { x, y }]) => {
            const id = Number(idStr);
            const part = parts.find((p) => p.id === id);
            if (!part) return acc;

            // 各パーツごとに元の移動量で制約を適用
            const newPosition = getConstrainedPosition(
              part,
              x,
              y,
              originalDx,
              originalDy
            );
            return [
              ...acc,
              {
                partId: id,
                updatePart: {
                  position: {
                    x: Math.round(newPosition.x),
                    y: Math.round(newPosition.y),
                  },
                },
              },
            ];
          },
          [] as {
            partId: number;
            updatePart: { position: { x: number; y: number } };
          }[]
        );

        // 副作用：状態更新をまとめて実行
        updatePartsData.forEach((updateData) => {
          dispatch({
            type: 'UPDATE_PART',
            payload: updateData,
          });
        });

        // 元位置記録をクリア
        originalPositionsRef.current = {};
      });
    },
    [gameBoardMode, measureOperation, parts, getConstrainedPosition, dispatch]
  );

  return {
    handlePartDragStart,
    handlePartDragMove,
    handlePartDragEnd,
  };
};
