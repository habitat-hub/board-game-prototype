import { Part } from '@/api/types';

// パーツ種別（APIの Part.type 相当）
export type PartType = Part['type'];

// 角丸の定数
const CORNER_RADIUS_CONCEPT = 20;
const CORNER_RADIUS_CARD = 10;
const CORNER_RADIUS_DEFAULT = 4;

// 画像角丸
const IMAGE_CORNER_RADIUS_CARD = 10;
const IMAGE_CORNER_RADIUS_DEFAULT = 4;

// 枠線幅
const STROKE_WIDTH_AREA = 3;
const STROKE_WIDTH_DEFAULT = 1;

// 破線パターン
const DASH_PATTERN_DASHED: number[] = [8, 8];

// 影の色
const SHADOW_COLOR_ACTIVE = 'rgba(59, 130, 246, 1)';
const SHADOW_COLOR_PHYSICAL = 'rgba(0, 0, 0, 0.15)';
const SHADOW_COLOR_NONE = 'transparent';

// 影のぼかし
const SHADOW_BLUR_ACTIVE = 10;
const SHADOW_BLUR_PHYSICAL = 4;
const SHADOW_BLUR_NONE = 0;

// 影のオフセット
const SHADOW_OFFSET_PHYSICAL = 2;
const SHADOW_OFFSET_ZERO = 0;

/**
 * パーツタイプが物理的なゲームピース（カードまたはトークン）かどうかを判定する
 * 物理的なパーツは影やその他の視覚効果を持つ
 * @param partType - 判定するパーツタイプ
 * @returns カードまたはトークンの場合true
 */
export const isPhysicalPartType = (partType: PartType): boolean => {
  // カードまたはトークンの場合
  return partType === 'card' || partType === 'token';
};

/**
 * パーツタイプが概念的なパーツ（手札または山札）かどうかを判定する
 * @param partType - 判定するパーツタイプ
 * @returns 手札または山札の場合true
 */
export const isConceptPartType = (partType: PartType): boolean => {
  return partType === 'hand' || partType === 'deck';
};

/**
 * パーツの背景用の角丸半径を取得する
 * @param partType - パーツタイプ
 * @returns 角丸半径（ピクセル）
 */
export const getCornerRadius = (partType: PartType): number => {
  // 概念パーツ（手札・山札）の場合
  if (isConceptPartType(partType)) {
    return CORNER_RADIUS_CONCEPT;
  }
  // カードの場合
  if (partType === 'card') {
    return CORNER_RADIUS_CARD;
  }
  // 上記以外（トークン・エリア等）
  return CORNER_RADIUS_DEFAULT;
};

/**
 * パーツの画像用の角丸半径を取得する
 * @param partType - パーツタイプ
 * @returns 角丸半径（ピクセル）
 */
export const getImageCornerRadius = (partType: PartType): number => {
  // カードの場合
  if (partType === 'card') {
    return IMAGE_CORNER_RADIUS_CARD;
  }
  // 上記以外
  return IMAGE_CORNER_RADIUS_DEFAULT;
};

/**
 * パーツの枠線幅を取得する
 * @param partType - パーツタイプ
 * @returns 枠線幅（ピクセル）
 */
export const getStrokeWidth = (partType: PartType): number => {
  // エリアの場合
  if (partType === 'area') return STROKE_WIDTH_AREA;
  // 上記以外
  return STROKE_WIDTH_DEFAULT;
};

/**
 * パーツの破線パターンを取得する
 * @param partType - パーツタイプ
 * @returns 破線パターン配列、または undefined（実線の場合）
 */
export const getDashPattern = (partType: PartType): number[] | undefined => {
  // 概念パーツまたはエリアの場合は点線
  if (isConceptPartType(partType) || partType === 'area') {
    // 破壊的変更の波及を避けるためコピーを返す
    return [...DASH_PATTERN_DASHED];
  }
  // 実線
  return undefined;
};

/**
 * パーツの影の色を取得する
 * @param partType - パーツタイプ
 * @param isActive - アクティブ状態かどうか
 * @returns 影の色
 */
export const getShadowColor = (
  partType: PartType,
  isActive: boolean
): string => {
  // アクティブの場合
  if (isActive) {
    return SHADOW_COLOR_ACTIVE;
  }
  // 物理パーツの場合
  if (isPhysicalPartType(partType)) {
    return SHADOW_COLOR_PHYSICAL;
  }
  // それ以外は影なし
  return SHADOW_COLOR_NONE;
};

/**
 * パーツの影のぼかし値を取得する
 * @param partType - パーツタイプ
 * @param isActive - アクティブ状態かどうか
 * @returns 影のぼかし値（ピクセル）
 */
export const getShadowBlur = (
  partType: PartType,
  isActive: boolean
): number => {
  // アクティブの場合
  if (isActive) return SHADOW_BLUR_ACTIVE;
  // 物理パーツの場合
  if (isPhysicalPartType(partType)) return SHADOW_BLUR_PHYSICAL;
  // それ以外
  return SHADOW_BLUR_NONE;
};

/**
 * パーツの影のX軸オフセットを取得する
 * @param partType - パーツタイプ
 * @param isActive - アクティブ状態かどうか
 * @returns 影のX軸オフセット（ピクセル）
 */
export const getShadowOffsetX = (
  partType: PartType,
  isActive: boolean
): number => {
  // アクティブの場合
  if (isActive) return SHADOW_OFFSET_ZERO;
  // 物理パーツの場合
  if (isPhysicalPartType(partType)) return SHADOW_OFFSET_PHYSICAL;
  // それ以外
  return SHADOW_OFFSET_ZERO;
};

/**
 * パーツの影のY軸オフセットを取得する
 * @param partType - パーツタイプ
 * @param isActive - アクティブ状態かどうか
 * @returns 影のY軸オフセット（ピクセル）
 */
export const getShadowOffsetY = (
  partType: PartType,
  isActive: boolean
): number => {
  // アクティブの場合
  if (isActive) return SHADOW_OFFSET_ZERO;
  // 物理パーツの場合
  if (isPhysicalPartType(partType)) return SHADOW_OFFSET_PHYSICAL;
  // それ以外
  return SHADOW_OFFSET_ZERO;
};

/**
 * 選択された色がカスタムカラーかどうかを判定する
 * @param colors - カラーパレット
 * @param selectedColor - 選択された色
 * @returns カスタムカラーの場合true
 */
export const isCustomColor = (colors: string[], selectedColor: string) => {
  return !colors.some((color: string) => color === selectedColor);
};
