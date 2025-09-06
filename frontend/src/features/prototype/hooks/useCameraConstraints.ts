import {
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

import {
  CAMERA_SCALE,
  CAMERA_MARGIN,
  GAME_BOARD_CONFIG,
  GAME_BOARD_CENTER,
} from '@/features/prototype/constants';
import {
  CameraPosition,
  ViewportSize,
  CameraConstraints,
} from '@/features/prototype/types';

/**
 * カメラ制約の計算と関連ユーティリティを提供するカスタムフック
 */
/**
 * useCameraConstraints の戻り値の型
 */
export type UseCameraConstraintsReturn = Readonly<{
  viewportSize: ViewportSize;
  setViewportSize: Dispatch<SetStateAction<ViewportSize>>;
  getCameraConstraints: (
    scale: number,
    vpSize: ViewportSize
  ) => CameraConstraints;
  getConstrainedCameraPosition: (
    x: number,
    y: number,
    scale: number
  ) => CameraPosition;
  computeCenteredCamera: (
    vpSize?: ViewportSize,
    scale?: number
  ) => CameraPosition;
}>;

/**
 * カメラ制約の計算と関連ユーティリティを提供するカスタムフック
 */
export const useCameraConstraints = (): UseCameraConstraintsReturn => {
  // ビューポートサイズを管理（SSR対応: lazy initializer で window 参照をガード）
  const [viewportSize, setViewportSize] = useState<ViewportSize>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));

  /**
   * 指定したスケールとビューポートサイズからカメラの制約を計算
   */
  const getCameraConstraints = useCallback(
    (scale: number, vpSize: ViewportSize): CameraConstraints => {
      const baseMargin =
        Math.min(vpSize.width, vpSize.height) * CAMERA_MARGIN.BASE_RATIO;
      const effectiveScale = Math.max(
        scale,
        CAMERA_MARGIN.MIN_SCALE_FOR_MARGIN
      );
      const dynamicMargin = baseMargin / effectiveScale;

      const contentW = GAME_BOARD_CONFIG.WIDTH * scale;
      const contentH = GAME_BOARD_CONFIG.HEIGHT * scale;
      const visibleW = vpSize.width;
      const visibleH = vpSize.height;

      const [minX, maxX] =
        contentW + 2 * dynamicMargin <= visibleW
          ? [(contentW - visibleW) / 2, (contentW - visibleW) / 2]
          : [-dynamicMargin, contentW - visibleW + dynamicMargin];
      const [minY, maxY] =
        contentH + 2 * dynamicMargin <= visibleH
          ? [(contentH - visibleH) / 2, (contentH - visibleH) / 2]
          : [-dynamicMargin, contentH - visibleH + dynamicMargin];

      return { minX, maxX, minY, maxY, dynamicMargin };
    },
    []
  );

  /**
   * 指定した位置とスケールを制約内に収めたカメラ位置を計算
   */
  const getConstrainedCameraPosition = useCallback(
    (x: number, y: number, scale: number): CameraPosition => {
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

  /**
   * ビューポートの中心にカメラを配置し、制約内に収めたカメラ位置を返す
   */
  const computeCenteredCamera = useCallback(
    (
      vpSize: ViewportSize = viewportSize,
      scale: number = CAMERA_SCALE.DEFAULT
    ): CameraPosition => {
      const targetX = GAME_BOARD_CENTER.x * scale - vpSize.width / 2;
      const targetY = GAME_BOARD_CENTER.y * scale - vpSize.height / 2;
      const { minX, maxX, minY, maxY } = getCameraConstraints(scale, vpSize);

      const constrainedX = Math.max(minX, Math.min(maxX, targetX));
      const constrainedY = Math.max(minY, Math.min(maxY, targetY));

      return { x: constrainedX, y: constrainedY, scale };
    },
    [viewportSize, getCameraConstraints]
  );

  return {
    viewportSize,
    setViewportSize,
    getCameraConstraints,
    getConstrainedCameraPosition,
    computeCenteredCamera,
  };
};
// 型は上部で明示
