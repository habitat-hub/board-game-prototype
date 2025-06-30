// 汎用的な矩形の重なり判定ユーティリティ
export type Rect = { x: number; y: number; width: number; height: number };

/**
 * 2つの矩形が重なっているか判定する
 * @param a - 矩形A
 * @param b - 矩形B
 * @returns 重なっていればtrue
 */
export function isRectOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
