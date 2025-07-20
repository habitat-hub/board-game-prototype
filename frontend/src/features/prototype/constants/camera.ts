/** カメラのスケール設定 */
export const CAMERA_SCALE = {
  /** 最小スケール */
  MIN: 0.18,
  /** 最大スケール */
  MAX: 8,
  /** デフォルトの初期スケール */
  DEFAULT: 0.5,
  /** ズームのステップ倍率 */
  STEP: 1.1,
  /** ホイールズームのステップ倍率（より細かい） */
  WHEEL_STEP: 1.02,
} as const;

/** カメラの動的マージン設定 */
export const CAMERA_MARGIN = {
  /** ベースマージンの比率（ビューポートサイズに対する） */
  BASE_RATIO: 0.3,
  /** マージン計算時の最小スケール */
  MIN_SCALE_FOR_MARGIN: 0.5,
} as const;
