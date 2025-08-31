import { getPartStyle, PartType } from './partTypeConfig';

export type { PartType } from './partTypeConfig';

// 影（アクティブ時）の色とサイズ
const SHADOW_COLOR_ACTIVE = 'rgba(59, 130, 246, 1)';
const SHADOW_BLUR_ACTIVE = 10;
const SHADOW_OFFSET_ZERO = 0;

/**
 * パーツタイプが物理的なゲームピース（カードまたはトークン）かどうかを判定する
 * 物理的なパーツは影やその他の視覚効果を持つ
 * @param partType - 判定するパーツタイプ
 * @returns カードまたはトークンの場合true
 */
const PHYSICAL_PART_TYPES: PartType[] = ['card', 'token'];

export const isPhysicalPartType = (partType: PartType): boolean =>
  PHYSICAL_PART_TYPES.includes(partType);

/**
 * パーツタイプが概念的なパーツ（手札または山札）かどうかを判定する
 * @param partType - 判定するパーツタイプ
 * @returns 手札または山札の場合true
 */
const CONCEPT_PART_TYPES: PartType[] = ['hand', 'deck'];

export const isConceptPartType = (partType: PartType): boolean =>
  CONCEPT_PART_TYPES.includes(partType);

/**
 * パーツの背景用の角丸半径を取得する
 * @param partType - パーツタイプ
 * @returns 角丸半径（ピクセル）
 */
export const getCornerRadius = (partType: PartType): number =>
  getPartStyle(partType).cornerRadius;

/**
 * パーツの画像用の角丸半径を取得する
 * @param partType - パーツタイプ
 * @returns 角丸半径（ピクセル）
 */
export const getImageCornerRadius = (partType: PartType): number =>
  getPartStyle(partType).imageCornerRadius;

/**
 * パーツの枠線幅を取得する
 * @param partType - パーツタイプ
 * @returns 枠線幅（ピクセル）
 */
export const getStrokeWidth = (partType: PartType): number =>
  getPartStyle(partType).strokeWidth;

/**
 * パーツの破線パターンを取得する
 * @param partType - パーツタイプ
 * @returns 破線パターン配列、または undefined（実線の場合）
 */
export const getDashPattern = (partType: PartType): number[] | undefined => {
  const pattern = getPartStyle(partType).dashPattern;
  return pattern ? [...pattern] : undefined;
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
): string =>
  isActive ? SHADOW_COLOR_ACTIVE : getPartStyle(partType).shadowColor;

/**
 * パーツの影のぼかし値を取得する
 * @param partType - パーツタイプ
 * @param isActive - アクティブ状態かどうか
 * @returns 影のぼかし値（ピクセル）
 */
export const getShadowBlur = (
  partType: PartType,
  isActive: boolean
): number =>
  isActive ? SHADOW_BLUR_ACTIVE : getPartStyle(partType).shadowBlur;

/**
 * パーツの影のX軸オフセットを取得する
 * @param partType - パーツタイプ
 * @param isActive - アクティブ状態かどうか
 * @returns 影のX軸オフセット（ピクセル）
 */
export const getShadowOffsetX = (
  partType: PartType,
  isActive: boolean
): number =>
  isActive ? SHADOW_OFFSET_ZERO : getPartStyle(partType).shadowOffset;

/**
 * パーツの影のY軸オフセットを取得する
 * @param partType - パーツタイプ
 * @param isActive - アクティブ状態かどうか
 * @returns 影のY軸オフセット（ピクセル）
 */
export const getShadowOffsetY = (
  partType: PartType,
  isActive: boolean
): number =>
  isActive ? SHADOW_OFFSET_ZERO : getPartStyle(partType).shadowOffset;

/**
 * 選択された色がカスタムカラーかどうかを判定する
 * @param colors - カラーパレット
 * @param selectedColor - 選択された色
 * @returns カスタムカラーの場合true
 */
export const isCustomColor = (
  colors: string[],
  selectedColor: string
): boolean => {
  const normalize = (s: string) => s.trim().toUpperCase();
  const target = normalize(selectedColor);
  return !colors.some((color: string) => normalize(color) === target);
};
