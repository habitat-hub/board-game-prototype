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
  mainViewRef: React.RefObject<HTMLDivElement>;
}

export const useCanvasEvents = ({
  camera,
  setCamera,
  setSelectedPartId,
  parts,
  mainViewRef,
}: UseCanvasEventsProps) => {
  const { dispatch } = usePartReducer();

  const [draggingPartId, setDraggingPartId] = useState<number | null>(null);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);

  /**
   * パーツの位置を更新するためのthrottledなdispatch関数
   * @param x - パーツのx座標
   * @param y - パーツのy座標
   */
  const throttledUpdate = useMemo(
    () =>
      throttle((x: number, y: number) => {
        if (draggingPartId === null) return;

        // 前回の位置
        const lastPosition = lastPositions.current.get(draggingPartId);

        // 前回の位置があり、かつ、前回の位置と現在の位置が5px以内の場合は更新しない
        if (
          lastPosition &&
          Math.abs(lastPosition.x - x) <= 5 &&
          Math.abs(lastPosition.y - y) <= 5
        ) {
          return;
        }

        lastPositions.current.set(draggingPartId, { x, y });
        dispatch({
          type: 'UPDATE_PART',
          payload: {
            partId: draggingPartId,
            updatePart: { position: { x, y } },
          },
        });
      }, 50),
    [draggingPartId, dispatch]
  );

  // 前回の位置を保持するためのref
  const lastPositions = useRef(new Map<number, { x: number; y: number }>());

  // throttleのクリーンアップ
  useEffect(() => {
    return () => {
      throttledUpdate.cancel();
    };
  }, [throttledUpdate]);

  /**
   * ズーム操作
   * @param e - ホイールイベント
   */
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      // TODO: スクロールの上限を決める
      setCamera((camera) => ({
        x: camera.x - e.deltaX,
        y: camera.y - e.deltaY,
        zoom: camera.zoom,
      }));
    },
    [setCamera]
  );

  /**
   * マウスダウンイベントのハンドラー
   * @param e - マウスイベント
   * @param partId - パーツID（パーツからの呼び出し時のみ）
   */
  const onMouseDown = (e: React.MouseEvent, partId?: number) => {
    // テキスト選択を防止
    e.preventDefault();

    if (partId !== undefined) {
      // パーツのドラッグ開始
      const part = parts.find((part) => part.id === partId);
      const rect = mainViewRef.current?.getBoundingClientRect();
      if (!rect || !part) return;

      setSelectedPartId(partId);
      setDraggingPartId(partId);

      const x = (e.clientX - rect.left) / camera.zoom - part.position.x;
      const y = (e.clientY - rect.top) / camera.zoom - part.position.y;
      setOffset({ x, y });
      return;
    }

    if (e.target === e.currentTarget || e.target instanceof SVGElement) {
      // キャンバスの移動開始
      setIsDraggingCanvas(true);
      setDragStart({
        x: e.clientX - camera.x,
        y: e.clientY - camera.y,
      });
    }
  };

  /**
   * マウス移動イベントのハンドラー
   * @param e - マウス移動イベント
   */
  const onMouseMove = (e: React.MouseEvent) => {
    // テキスト選択を防止（ドラッグ中）
    if (isDraggingCanvas || draggingPartId !== null) {
      e.preventDefault();
    }

    if (draggingPartId !== null) {
      // パーツのドラッグ処理
      const rect = mainViewRef.current?.getBoundingClientRect();
      if (!rect) return;

      // マウス位置からパーツの新しい位置を計算
      const rawX = (e.clientX - rect.left) / camera.zoom - offset.x;
      const rawY = (e.clientY - rect.top) / camera.zoom - offset.y;

      const x = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
      const y = Math.round(rawY / GRID_SIZE) * GRID_SIZE;

      // パーツの位置を更新
      throttledUpdate(x, y);
      return;
    }

    if (isDraggingCanvas) {
      // カメラの移動処理
      setCamera((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
      setSelectedPartId(null);
    }
  };

  /**
   * マウスアップイベントのハンドラー
   */
  const onMouseUp = (e: React.MouseEvent) => {
    // パーツ移動でない場合
    if (draggingPartId === null) {
      setDraggingPartId(null);
      setIsDraggingCanvas(false);
      return;
    }

    const rect = mainViewRef.current?.getBoundingClientRect();
    if (!rect) {
      setDraggingPartId(null);
      setIsDraggingCanvas(false);
      return;
    }

    const part = parts.find((part) => part.id === draggingPartId);
    // パーツがカードでない場合
    if (!part || part.type !== 'card') {
      setDraggingPartId(null);
      setIsDraggingCanvas(false);
      return;
    }

    // 親パーツの更新
    let newX = (e.clientX - rect.left) / camera.zoom - offset.x;
    let newY = (e.clientY - rect.top) / camera.zoom - offset.y;

    newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
    newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;

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
          partId: draggingPartId,
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
          cardId: draggingPartId,
          isNextFlipped: !isPreviousParentReverseRequired,
        },
      });
    }

    setDraggingPartId(null);
    setIsDraggingCanvas(false);
  };

  return {
    isDraggingCanvas,
    onWheel,
    onMouseDown,
    onMouseMove,
    onMouseUp,
  };
};
