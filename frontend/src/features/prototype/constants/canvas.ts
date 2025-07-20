/** グリッドサイズ */
export const GRID_SIZE = 50;

/** キャンバスサイズ */
export const CANVAS_SIZE = 5000;

/** キャンバスの設定 */
export const CANVAS_CONFIG = {
  /** キャンバスの幅 */
  WIDTH: CANVAS_SIZE,
  /** キャンバスの高さ */
  HEIGHT: CANVAS_SIZE,
  /** グリッドサイズ */
  GRID_SIZE: GRID_SIZE,
} as const;

/** キャンバス中央座標 */
export const CANVAS_CENTER_COORDS = {
  /** X座標の中央位置 */
  x: CANVAS_CONFIG.WIDTH / 2,
  /** Y座標の中央位置 */
  y: CANVAS_CONFIG.HEIGHT / 2,
} as const;
