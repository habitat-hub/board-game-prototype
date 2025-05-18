import { throttle } from 'lodash';
import { useCallback, useMemo, useState, useEffect, useRef } from 'react';

import { Part } from '@/api/types';
import { GRID_SIZE } from '@/features/prototype/const';
import { needsParentUpdate } from '@/features/prototype/helpers/partHelper';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import { Camera, Point } from '@/features/prototype/type';

interface UseCanvasEventsProps {
  camera: Camera;
  setCamera: React.Dispatch<React.SetStateAction<Camera>>;
  setSelectedPartId: React.Dispatch<React.SetStateAction<number | null>>;
  parts: Part[];
  canvasContainerRef: React.RefObject<HTMLDivElement>;
}

export const useCanvasEvents = ({
  camera,
  setCamera,
  setSelectedPartId,
  parts,
  canvasContainerRef,
}: UseCanvasEventsProps) => {
  const { dispatch } = usePartReducer();

  // 移動中のキャンバス
  const [movingCanvas, setMovingCanvas] = useState<{
    startX: number;
    startY: number;
  } | null>(null);

  // 移動中のパーツ
  const [movingPart, setMovingPart] = useState<{
    partId: number;
    startX: number;
    startY: number;
    offset: Point;
  } | null>(null);

  // リサイズ中のパーツ
  const [resizingPart, setResizingPart] = useState<{
    partId: number;
    startWidth: number;
    startHeight: number;
    startClientX: number;
    startClientY: number;
  } | null>(null);

  // 前回の位置を保持するためのref
  const lastPositions = useRef(new Map<number, { x: number; y: number }>());

  /**
   * パーツの位置を更新するためのthrottledなdispatch関数
   * @param x - パーツのx座標
   * @param y - パーツのy座標
   */
  const throttledUpdatePosition = useMemo(
    () =>
      throttle((x: number, y: number) => {
        if (!movingPart) return;

        // 移動中のパーツのID
        const movingPartId = movingPart.partId;

        // 前回の位置
        const lastPosition = lastPositions.current.get(movingPartId);

        // 前回の位置があり、かつ、前回の位置と現在の位置が5px以内の場合は更新しない
        if (
          lastPosition &&
          Math.abs(lastPosition.x - x) <= 10 &&
          Math.abs(lastPosition.y - y) <= 10
        ) {
          return;
        }

        // 前回の位置を更新
        lastPositions.current.set(movingPartId, { x, y });

        // パーツの位置を更新
        dispatch({
          type: 'UPDATE_PART',
          payload: {
            partId: movingPartId,
            updatePart: { position: { x, y } },
          },
        });
      }, 100),
    [movingPart, dispatch]
  );

  // throttleのクリーンアップ
  useEffect(() => {
    return () => {
      throttledUpdatePosition.cancel();
    };
  }, [throttledUpdatePosition]);

  /**
   * ズーム操作
   * @param e - ホイールイベント
   */
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      // マウスホイールを使った移動（パン）の実装
      // deltaX, deltaYの値をズームレベルで調整して、ズームレベルに応じた適切な移動量にする
      const scaleFactor = 1 / camera.zoom;
      setCamera((camera) => ({
        x: camera.x - e.deltaX * scaleFactor * 0.5,
        y: camera.y - e.deltaY * scaleFactor * 0.5,
        zoom: camera.zoom,
      }));
    },
    [setCamera, camera.zoom]
  );

  /**
   * キャンバスに関するマウスダウンイベントのハンドラー
   * @param e - マウスイベント
   */
  const onCanvasMouseDown = (e: React.MouseEvent) => {
    // テキスト選択を防止
    e.preventDefault();

    setSelectedPartId(null);

    // キャンバスの移動開始
    setMovingCanvas({
      startX: e.clientX - camera.x,
      startY: e.clientY - camera.y,
    });
  };

  /**
   * パーツに関するマウスダウンイベントのハンドラー
   * @param e - マウスイベント
   * @param partId - パーツID
   */
  const onPartMouseDown = (e: React.MouseEvent, partId: number) => {
    // テキスト選択を防止
    e.preventDefault();

    e.stopPropagation();

    const part = parts.find((part) => part.id === partId);
    const rect = canvasContainerRef.current?.getBoundingClientRect();
    // パーツが見つからない場合
    if (!rect || !part) return;

    // パーツの選択
    setSelectedPartId(partId);

    const target = e.target as SVGElement;
    const direction = target.getAttribute('data-resize-direction') as
      | 'northWest'
      | 'northEast'
      | 'southEast'
      | 'southWest';

    // パーツのリサイズ
    if (direction) {
      setResizingPart({
        partId,
        startWidth: part.width,
        startHeight: part.height,
        startClientX: e.clientX,
        startClientY: e.clientY,
      });
      return;
    }

    // パーツの移動
    const x = (e.clientX - rect.left) / camera.zoom - part.position.x;
    const y = (e.clientY - rect.top) / camera.zoom - part.position.y;
    setMovingPart({
      partId,
      startX: part.position.x,
      startY: part.position.y,
      offset: { x, y },
    });
  };

  /**
   * マウス移動イベントのハンドラー
   * @param e - マウス移動イベント
   */
  const onMouseMove = (e: React.MouseEvent) => {
    // テキスト選択を防止（ドラッグ中）
    if (movingCanvas || movingPart !== null) {
      e.preventDefault();
    }

    if (resizingPart) return;

    // パーツの移動中
    if (movingPart) {
      // パーツのドラッグ処理
      const rect = canvasContainerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // マウス位置からパーツの新しい位置を計算
      const rawX = (e.clientX - rect.left) / camera.zoom - movingPart.offset.x;
      const rawY = (e.clientY - rect.top) / camera.zoom - movingPart.offset.y;

      const x = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
      const y = Math.round(rawY / GRID_SIZE) * GRID_SIZE;

      // パーツの位置を更新
      throttledUpdatePosition(x, y);
      return;
    }

    // キャンバスの移動中
    if (movingCanvas) {
      // カメラの移動処理
      setCamera((prev) => ({
        ...prev,
        x: e.clientX - movingCanvas.startX,
        y: e.clientY - movingCanvas.startY,
      }));
    }
  };

  /**
   * マウスイベントのクリーンアップ
   */
  const cleanUp = () => {
    setMovingCanvas(null);
    setMovingPart(null);
    setResizingPart(null);
  };

  /**
   * マウスアップイベントのハンドラー
   */
  const onMouseUp = (e: React.MouseEvent) => {
    // リサイズ中
    if (resizingPart) {
      e.stopPropagation();
      const dx = e.clientX - resizingPart.startClientX;
      const dy = e.clientY - resizingPart.startClientY;

      const newWidth =
        resizingPart.startWidth + dx > 50 ? resizingPart.startWidth + dx : 50;
      const newHeight =
        resizingPart.startHeight + dy > 50 ? resizingPart.startHeight + dy : 50;

      const payload = {
        partId: resizingPart.partId,
        updatePart: {
          width: newWidth,
          height: newHeight,
        },
      };

      dispatch({
        type: 'UPDATE_PART',
        payload,
      });

      cleanUp();
      return;
    }

    // パーツ移動でない場合
    if (!movingPart) {
      cleanUp();
      return;
    }

    const rect = canvasContainerRef.current?.getBoundingClientRect();
    // パーツが見つからない場合
    if (!rect) {
      cleanUp();
      return;
    }

    const part = parts.find((part) => part.id === movingPart.partId);
    // パーツがカードでない場合
    if (!part || part.type !== 'card') {
      cleanUp();
      return;
    }

    // 親パーツの更新
    let newX = (e.clientX - rect.left) / camera.zoom - movingPart.offset.x;
    let newY = (e.clientY - rect.top) / camera.zoom - movingPart.offset.y;

    newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
    newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;

    // 新しい位置
    const newPosition = {
      x: newX,
      y: newY,
    };

    const { needsUpdate, parentPart } = needsParentUpdate(
      parts,
      part,
      newPosition
    );
    if (needsUpdate) {
      dispatch({
        type: 'UPDATE_PART',
        payload: {
          partId: movingPart.partId,
          updatePart: { parentId: parentPart?.id || undefined },
        },
      });
    }

    // カードの反転処理
    // 前の親は裏向き必須か
    const previousParentPart = parts.find((p) => p.id === part.parentId);
    const isPreviousParentReverseRequired =
      !!(previousParentPart?.type === 'deck') &&
      !!previousParentPart.canReverseCardOnDeck;

    // 新しい親は裏向き必須か
    const isNextParentReverseRequired =
      !!(parentPart?.type === 'deck') && !!parentPart.canReverseCardOnDeck;

    if (isPreviousParentReverseRequired !== isNextParentReverseRequired) {
      dispatch({
        type: 'FLIP_CARD',
        payload: {
          cardId: movingPart.partId,
          isNextFlipped: !isPreviousParentReverseRequired,
        },
      });
    }

    cleanUp();
  };

  return {
    isDraggingCanvas: !!movingCanvas,
    onWheel,
    onCanvasMouseDown,
    onPartMouseDown,
    onMouseMove,
    onMouseUp,
  };
};
