/**
 * @page ゲームボードのカメラ制御を管理するカスタムフック
 */
import Konva from 'konva';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Part } from '@/api/types';
import {
  CAMERA_SCALE,
  CAMERA_MARGIN,
  CANVAS_CONFIG,
  CANVAS_CENTER_COORDS,
} from '@/features/prototype/constants';
import { CameraPosition, ViewportSize } from '@/features/prototype/types';
import { calculateAveragePartsCenter } from '@/features/prototype/utils/cameraUtils';

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
  // ビューポートサイズの管理
  const [viewportSize, setViewportSize] = useState<ViewportSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  /**
   * 動的マージンの計算
   */
  const calculateDynamicMargin = useCallback(
    (scale: number) => {
      const baseMargin =
        Math.min(viewportSize.width, viewportSize.height) *
        CAMERA_MARGIN.BASE_RATIO;
      return baseMargin / Math.max(scale, CAMERA_MARGIN.MIN_SCALE_FOR_MARGIN);
    },
    [viewportSize]
  );

  /**
   * キャンバス内に収まるように調整したカメラ位置を計算
   */
  const getConstrainedCameraPosition = useCallback(
    (x: number, y: number, scale: number): CameraPosition => {
      const dynamicMargin = calculateDynamicMargin(scale);

      const minX = -dynamicMargin;
      const maxX =
        CANVAS_CONFIG.WIDTH * scale - viewportSize.width + dynamicMargin;
      const minY = -dynamicMargin;
      const maxY =
        CANVAS_CONFIG.HEIGHT * scale - viewportSize.height + dynamicMargin;

      const constrainedX = Math.max(minX, Math.min(maxX, x));
      const constrainedY = Math.max(minY, Math.min(maxY, y));

      return {
        x: constrainedX,
        y: constrainedY,
        scale,
      };
    },
    [viewportSize, calculateDynamicMargin]
  );

  /**
   * 初期カメラ位置を計算
   */
  const calculateInitialCameraPosition = useCallback(
    (viewportSize: ViewportSize): CameraPosition => {
      const averageCenter = calculateAveragePartsCenter(parts);
      // パーツがない場合はキャンバス中央を表示
      if (!averageCenter) {
        return {
          x:
            CANVAS_CENTER_COORDS.x * CAMERA_SCALE.DEFAULT -
            viewportSize.width / 2,
          y:
            CANVAS_CENTER_COORDS.y * CAMERA_SCALE.DEFAULT -
            viewportSize.height / 2,
          scale: CAMERA_SCALE.DEFAULT,
        };
      }

      // カメラの中央が全パーツの平均センターになるようにカメラの左上位置を計算
      const targetX =
        averageCenter.x * CAMERA_SCALE.DEFAULT - viewportSize.width / 2;
      const targetY =
        averageCenter.y * CAMERA_SCALE.DEFAULT - viewportSize.height / 2;

      return getConstrainedCameraPosition(
        targetX,
        targetY,
        CAMERA_SCALE.DEFAULT
      );
    },
    [getConstrainedCameraPosition, parts]
  );

  // 初期カメラ位置
  const initialCamera = useMemo((): CameraPosition => {
    return calculateInitialCameraPosition(viewportSize);
  }, [calculateInitialCameraPosition, viewportSize]);

  // カメラの状態管理
  const [camera, setCamera] = useState<CameraPosition>(() => initialCamera);
  const hasInitializedRef = useRef(false);

  // カメラ位置の初期化とリセット
  useEffect(() => {
    // パーツがある場合、初期位置にリセット
    if (!hasInitializedRef.current && parts.length > 0) {
      hasInitializedRef.current = true;
      setCamera(initialCamera);
      return;
    }

    // パーツが0の場合、初期位置にリセット
    if (parts.length === 0) {
      setCamera(initialCamera);
    }
  }, [parts.length, initialCamera]);

  // ウィンドウリサイズの処理
  useEffect(() => {
    const handleResize = () => {
      const newViewportSize: ViewportSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      setViewportSize(newViewportSize);
      setCamera(calculateInitialCameraPosition(newViewportSize));
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateInitialCameraPosition]);

  /**
   * ホイールイベントハンドラー（ズーム・パン）
   */
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      // macOSトラックパッドの二本指移動でパン、Ctrlキー押下時はズーム
      if (!e.evt.ctrlKey && !e.evt.metaKey) {
        // パン（カメラ移動）
        const { deltaX, deltaY } = e.evt;
        setCamera((prev) => {
          const newX = prev.x + deltaX;
          const newY = prev.y + deltaY;
          return getConstrainedCameraPosition(newX, newY, prev.scale);
        });
        return;
      }

      // ズーム（より滑らかなスケール変更）
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
    [camera, stageRef, getConstrainedCameraPosition]
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
    [getConstrainedCameraPosition]
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
  }, [camera, viewportSize, getConstrainedCameraPosition]);

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
  }, [camera, viewportSize, getConstrainedCameraPosition]);

  // ズーム可能状態の判定
  const canZoomIn = camera.scale < CAMERA_SCALE.MAX;
  const canZoomOut = camera.scale > CAMERA_SCALE.MIN;

  return {
    camera,
    viewportSize,
    canvasSize: {
      width: CANVAS_CONFIG.WIDTH,
      height: CANVAS_CONFIG.HEIGHT,
    },
    handleWheel,
    handleDragMove,
    handleZoomIn,
    handleZoomOut,
    canZoomIn,
    canZoomOut,
  };
};
