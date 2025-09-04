/**
 * @page ゲームボードのカメラ制御を管理するカスタムフック
 */
import type Konva from 'konva';
import { useEffect, useState } from 'react';

import { Part } from '@/api/types';
import { CAMERA_SCALE, GAME_BOARD_CONFIG } from '@/features/prototype/constants';
import { useCameraConstraints } from '@/features/prototype/hooks/useCameraConstraints';
import { useCameraHandlers } from '@/features/prototype/hooks/useCameraHandlers';
import { CameraPosition, ViewportSize } from '@/features/prototype/types';

interface UseGameCameraProps {
  /** パーツリスト（初期カメラ位置計算用） */
  parts: Part[];
  /** Konvaステージの参照 */
  stageRef: React.RefObject<Konva.Stage | null>;
}

interface UseGameCameraReturn {
  /** カメラの現在位置とスケール */
  camera: CameraPosition;
  /** ビューポートサイズ */
  viewportSize: ViewportSize;
  /** キャンバスサイズ */
  canvasSize: { width: number; height: number };
  /** ホイールイベントハンドラー */
  handleWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  /** ドラッグ移動ハンドラー */
  handleDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void;
  /** ズームインハンドラー */
  handleZoomIn: () => void;
  /** ズームアウトハンドラー */
  handleZoomOut: () => void;
  /** ズーム可能状態 */
  canZoomIn: boolean;
  /** ズームアウト可能状態 */
  canZoomOut: boolean;
}

/**
 * ゲームボードのカメラ制御を管理するカスタムフック
 */
export const useGameCamera = ({
  parts,
  stageRef,
}: UseGameCameraProps): UseGameCameraReturn => {
  const {
    viewportSize,
    setViewportSize,
    getCameraConstraints,
    getConstrainedCameraPosition,
    computeCenteredCamera,
  } = useCameraConstraints();

  // カメラの状態管理（初期位置: 最新パーツの中心 or ボード中央）
  const [camera, setCamera] = useState<CameraPosition>(() => {
    if (parts.length > 0) {
      const latestPart = parts.reduce((latest, part) =>
        new Date(part.createdAt) > new Date(latest.createdAt) ? part : latest
      );
      const centerX = latestPart.position.x + latestPart.width / 2;
      const centerY = latestPart.position.y + latestPart.height / 2;
      const targetX =
        centerX * CAMERA_SCALE.DEFAULT - viewportSize.width / 2;
      const targetY =
        centerY * CAMERA_SCALE.DEFAULT - viewportSize.height / 2;
      return getConstrainedCameraPosition(
        targetX,
        targetY,
        CAMERA_SCALE.DEFAULT
      );
    }
    return computeCenteredCamera();
  });

  // ウィンドウリサイズ時は現在の scale を保持し、x/y を新しい viewport に合わせて範囲内に収める
  useEffect(() => {
    const handleResize = () => {
      const newViewportSize: ViewportSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      setViewportSize(newViewportSize);

      setCamera((prev) => {
        const { minX, maxX, minY, maxY } = getCameraConstraints(
          prev.scale,
          newViewportSize
        );

        const constrainedX = Math.max(minX, Math.min(maxX, prev.x));
        const constrainedY = Math.max(minY, Math.min(maxY, prev.y));

        return { x: constrainedX, y: constrainedY, scale: prev.scale };
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [getCameraConstraints, setViewportSize]);

  const {
    handleWheel,
    handleDragMove,
    handleZoomIn,
    handleZoomOut,
    canZoomIn,
    canZoomOut,
  } = useCameraHandlers({
    camera,
    setCamera,
    stageRef,
    viewportSize,
    getConstrainedCameraPosition,
  });

  return {
    camera,
    viewportSize,
    canvasSize: {
      width: GAME_BOARD_CONFIG.WIDTH,
      height: GAME_BOARD_CONFIG.HEIGHT,
    },
    handleWheel,
    handleDragMove,
    handleZoomIn,
    handleZoomOut,
    canZoomIn,
    canZoomOut,
  };
};
