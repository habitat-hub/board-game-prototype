import { useCallback, useState } from 'react';

import { PART_TYPE } from '@/features/prototype/const';
import { needsParentUpdate } from '@/features/prototype/helpers/partHelper';
import { Camera, Point } from '@/features/prototype/type';
import { Part } from '@/types/models';

interface UseCanvasEventsProps {
  camera: Camera;
  setCamera: React.Dispatch<React.SetStateAction<Camera>>;
  setSelectedPart: React.Dispatch<React.SetStateAction<Part | null>>;
  updatePart: (partId: number, updatePart: Partial<Part>) => void;
  reverseCard: (partId: number, isNextFlipped: boolean) => void;
  parts: Part[];
  mainViewRef: React.RefObject<HTMLDivElement>;
}

export const useCanvasEvents = ({
  camera,
  setCamera,
  setSelectedPart,
  updatePart,
  reverseCard,
  parts,
  mainViewRef,
}: UseCanvasEventsProps) => {
  const [draggingPartId, setDraggingPartId] = useState<number | null>(null);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);

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
    if (partId !== undefined) {
      // パーツのドラッグ開始
      const part = parts.find((part) => part.id === partId) as Part;
      const rect = mainViewRef.current?.getBoundingClientRect();
      if (!rect) return;

      setSelectedPart(part);
      setDraggingPartId(partId);

      const x =
        (e.clientX - rect.left) / camera.zoom - (part.position.x as number);
      const y =
        (e.clientY - rect.top) / camera.zoom - (part.position.y as number);
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
    if (draggingPartId !== null) {
      // パーツのドラッグ処理
      const rect = mainViewRef.current?.getBoundingClientRect();
      if (!rect) return;

      // マウス位置からパーツの新しい位置を計算
      const x = (e.clientX - rect.left) / camera.zoom - offset.x;
      const y = (e.clientY - rect.top) / camera.zoom - offset.y;

      updatePart(draggingPartId, { position: { x, y } });
      return;
    }

    if (isDraggingCanvas) {
      // カメラの移動処理
      setCamera((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
      setSelectedPart(null);
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
    if (!part || part.type !== PART_TYPE.CARD) {
      setDraggingPartId(null);
      setIsDraggingCanvas(false);
      return;
    }

    // 親パーツの更新
    const newPosition = {
      x: (e.clientX - rect.left) / camera.zoom - offset.x,
      y: (e.clientY - rect.top) / camera.zoom - offset.y,
    };
    const { needsUpdate, parentPart } = needsParentUpdate(
      parts,
      part,
      newPosition
    );
    if (needsUpdate) {
      updatePart(draggingPartId, { parentId: parentPart?.id || null });
    }

    // カードの反転処理
    // 前の親は裏向き必須か
    const previousParentPart = parts.find((p) => p.id === part.parentId);
    const isPreviousParentReverseRequired =
      !!(previousParentPart?.type === PART_TYPE.DECK) &&
      !!previousParentPart.canReverseCardOnDeck;

    // 新しい親は裏向き必須か
    const isNextParentReverseRequired =
      !!(parentPart?.type === PART_TYPE.DECK) &&
      !!parentPart.canReverseCardOnDeck;

    if (isPreviousParentReverseRequired !== isNextParentReverseRequired) {
      reverseCard(draggingPartId, !isPreviousParentReverseRequired);
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
