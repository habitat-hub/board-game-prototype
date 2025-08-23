/**
 * @page ゲームボードのカメラ制御を管理するカスタムフック
 */
import Konva from 'konva';
import { useCallback, useEffect, useState } from 'react';

import { Part } from '@/api/types';
import {
  CAMERA_SCALE,
  CAMERA_MARGIN,
  CANVAS_CONFIG,
  CANVAS_CENTER_COORDS,
} from '@/features/prototype/constants';
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
  parts: _parts,
  stageRef,
}: UseGameCameraProps): UseGameCameraReturn => {
  // 初期ビューポートサイズ（同期的に計算して初期カメラ位置に使う）
  const initialViewportSize: ViewportSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  // ビューポートサイズの管理
  const [viewportSize, setViewportSize] =
    useState<ViewportSize>(initialViewportSize);

  /**
   * 動的マージンの計算
   */
  // 共通: 指定 viewport と scale に対するカメラ制約（min/max と dynamicMargin）を計算して返す
  const getCameraConstraints = useCallback(
    (scale: number, vpSize: ViewportSize) => {
      // ビューポートの短辺に対して基準マージンを算出
      const baseMargin =
        Math.min(vpSize.width, vpSize.height) * CAMERA_MARGIN.BASE_RATIO;

      // scale が小さいときにマージンが過度に増えないように下限を設けつつ動的マージンを算出
      const dynamicMargin =
        baseMargin / Math.max(scale, CAMERA_MARGIN.MIN_SCALE_FOR_MARGIN);

      // キャンバスの表示可能領域を min/max で表現（x/y）
      // カメラはキャンバスの左上(0,0)ではなく、カメラオフセットとして x,y を持つため
      // マイナスマージンを許容することでキャンバス外側への余白を確保する
      const minX = -dynamicMargin;
      const maxX = CANVAS_CONFIG.WIDTH * scale - vpSize.width + dynamicMargin;
      const minY = -dynamicMargin;
      const maxY = CANVAS_CONFIG.HEIGHT * scale - vpSize.height + dynamicMargin;

      // 呼び出し側で x,y を範囲内に収めたり、dynamicMargin を参照したりできるよう返す
      return { minX, maxX, minY, maxY, dynamicMargin };
    },
    []
  );

  /**
   * キャンバス内に収まるように調整したカメラ位置を計算
   */
  const getConstrainedCameraPosition = useCallback(
    (x: number, y: number, scale: number): CameraPosition => {
      // 指定 scale と現在の viewportSize に基づいてカメラの制約を取得
      const { minX, maxX, minY, maxY } = getCameraConstraints(
        scale,
        viewportSize
      );

      const constrainedX = Math.max(minX, Math.min(maxX, x));
      const constrainedY = Math.max(minY, Math.min(maxY, y));
      return { x: constrainedX, y: constrainedY, scale };
    },
    [viewportSize, getCameraConstraints]
  );

  // 簡易ヘルパー: 指定viewportでキャンバス中心にカメラを配置し、制約を適用する
  const computeCenteredCamera = useCallback(
    (vpSize: ViewportSize, scale = CAMERA_SCALE.DEFAULT): CameraPosition => {
      const targetX = CANVAS_CENTER_COORDS.x * scale - vpSize.width / 2;
      const targetY = CANVAS_CENTER_COORDS.y * scale - vpSize.height / 2;
      // 中心配置ターゲットが範囲外にならないようにするため、同じ制約計算を利用
      const { minX, maxX, minY, maxY } = getCameraConstraints(scale, vpSize);

      const constrainedX = Math.max(minX, Math.min(maxX, targetX));
      const constrainedY = Math.max(minY, Math.min(maxY, targetY));

      return { x: constrainedX, y: constrainedY, scale };
    },
    [getCameraConstraints]
  );

  // カメラの状態管理（初期化時に常にキャンバス中央へ）
  const [camera, setCamera] = useState<CameraPosition>(() =>
    computeCenteredCamera(initialViewportSize)
  );

  // ウィンドウリサイズ時は現在の scale を保持し、x/y を新しい viewport に合わせて範囲内に収める
  useEffect(() => {
    const handleResize = () => {
      const newViewportSize: ViewportSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      // まず viewport を更新し、その後カメラ位置を現在の scale を維持したまま範囲内に収める
      setViewportSize(newViewportSize);

      setCamera((prev) => {
        const scale = prev.scale;
        // リサイズ後の viewport に対して同じカメラ制約を計算して、
        // カメラ位置が範囲外にならないように制限する
        const { minX, maxX, minY, maxY } = getCameraConstraints(
          scale,
          newViewportSize
        );

        const constrainedX = Math.max(minX, Math.min(maxX, prev.x));
        const constrainedY = Math.max(minY, Math.min(maxY, prev.y));

        return { x: constrainedX, y: constrainedY, scale };
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [getCameraConstraints]);

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
