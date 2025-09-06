import type Konva from 'konva';
import { useCallback } from 'react';

import { CAMERA_SCALE } from '@/features/prototype/constants';
import { CameraPosition, ViewportSize } from '@/features/prototype/types';

interface UseCameraHandlersProps {
  camera: CameraPosition;
  setCamera: React.Dispatch<React.SetStateAction<CameraPosition>>;
  stageRef: React.RefObject<Konva.Stage | null>;
  viewportSize: ViewportSize;
  getConstrainedCameraPosition: (
    x: number,
    y: number,
    scale: number
  ) => CameraPosition;
}

/**
 * カメラ操作に関連するイベントハンドラを提供するカスタムフック
 */
export const useCameraHandlers = ({
  camera,
  setCamera,
  stageRef,
  viewportSize,
  getConstrainedCameraPosition,
}: UseCameraHandlersProps) => {
  /**
   * ホイールイベントハンドラー（ズーム・パン）
   */
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      // macOSトラックパッドの二本指移動でパン、Ctrlキー押下時はズーム
      if (!e.evt.ctrlKey && !e.evt.metaKey) {
        const { deltaX, deltaY } = e.evt;
        setCamera((prev) => {
          const newX = prev.x + deltaX;
          const newY = prev.y + deltaY;
          return getConstrainedCameraPosition(newX, newY, prev.scale);
        });
        return;
      }

      const oldScale = camera.scale;
      const stage = stageRef.current;
      const pointer = stage?.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x + camera.x) / oldScale,
        y: (pointer.y + camera.y) / oldScale,
      };

      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale =
        direction > 0
          ? Math.min(oldScale * CAMERA_SCALE.WHEEL_STEP, CAMERA_SCALE.MAX)
          : Math.max(oldScale / CAMERA_SCALE.WHEEL_STEP, CAMERA_SCALE.MIN);

      const newX = mousePointTo.x * newScale - pointer.x;
      const newY = mousePointTo.y * newScale - pointer.y;

      setCamera(getConstrainedCameraPosition(newX, newY, newScale));
    },
    [camera, stageRef, getConstrainedCameraPosition, setCamera]
  );

  /**
   * ドラッグ移動ハンドラー
   */
  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const { movementX, movementY } = e.evt;
      setCamera((prev) => {
        const newX = prev.x - movementX;
        const newY = prev.y - movementY;

        return getConstrainedCameraPosition(newX, newY, prev.scale);
      });
      e.target.position({ x: 0, y: 0 });
    },
    [getConstrainedCameraPosition, setCamera]
  );

  /**
   * ズームイン処理
   */
  const handleZoomIn = useCallback(() => {
    const oldScale = camera.scale;
    const newScale = Math.min(oldScale * CAMERA_SCALE.STEP, CAMERA_SCALE.MAX);

    const viewportCenterX = viewportSize.width / 2;
    const viewportCenterY = viewportSize.height / 2;

    const mousePointTo = {
      x: (viewportCenterX + camera.x) / oldScale,
      y: (viewportCenterY + camera.y) / oldScale,
    };

    const newX = mousePointTo.x * newScale - viewportCenterX;
    const newY = mousePointTo.y * newScale - viewportCenterY;

    setCamera(getConstrainedCameraPosition(newX, newY, newScale));
  }, [camera, viewportSize, getConstrainedCameraPosition, setCamera]);

  /**
   * ズームアウト処理
   */
  const handleZoomOut = useCallback(() => {
    const oldScale = camera.scale;
    const newScale = Math.max(oldScale / CAMERA_SCALE.STEP, CAMERA_SCALE.MIN);

    const viewportCenterX = viewportSize.width / 2;
    const viewportCenterY = viewportSize.height / 2;

    const mousePointTo = {
      x: (viewportCenterX + camera.x) / oldScale,
      y: (viewportCenterY + camera.y) / oldScale,
    };

    const newX = mousePointTo.x * newScale - viewportCenterX;
    const newY = mousePointTo.y * newScale - viewportCenterY;

    setCamera(getConstrainedCameraPosition(newX, newY, newScale));
  }, [camera, viewportSize, getConstrainedCameraPosition, setCamera]);

  // ズーム可能状態の判定
  const canZoomIn = camera.scale < CAMERA_SCALE.MAX;
  const canZoomOut = camera.scale > CAMERA_SCALE.MIN;

  return {
    handleWheel,
    handleDragMove,
    handleZoomIn,
    handleZoomOut,
    canZoomIn,
    canZoomOut,
  };
};

export type UseCameraHandlersReturn = ReturnType<typeof useCameraHandlers>;
