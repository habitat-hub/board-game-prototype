/** グリッドサイズ */
export const GRID_SIZE = 50;

/** ボードサイズ */
export const GAME_BOARD_SIZE = 5000;

/** ボードの設定 */
export const GAME_BOARD_CONFIG = {
  /** ボードの幅 */
  WIDTH: GAME_BOARD_SIZE,
  /** ボードの高さ */
  HEIGHT: GAME_BOARD_SIZE,
  /** グリッドサイズ */
  GRID_SIZE: GRID_SIZE,
} as const;

/** ボード中央座標 */
export const GAME_BOARD_CENTER = {
  /** X座標の中央位置 */
  x: GAME_BOARD_CONFIG.WIDTH / 2,
  /** Y座標の中央位置 */
  y: GAME_BOARD_CONFIG.HEIGHT / 2,
} as const;
