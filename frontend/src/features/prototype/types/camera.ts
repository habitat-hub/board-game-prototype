/** カメラの位置情報型 */
export type CameraPosition = {
  /** X座標 */
  x: number;
  /** Y座標 */
  y: number;
  /** スケール */
  scale: number;
};

/** ビューポートサイズ型 */
export type ViewportSize = {
  /** 幅 */
  width: number;
  /** 高さ */
  height: number;
};

/** カメラ制約を表す型 */
export type CameraConstraints = Readonly<{
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  dynamicMargin: number;
}>;
