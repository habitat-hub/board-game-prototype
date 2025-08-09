/**
 * パーツタイプが物理的なゲームピース（カードまたはトークン）かどうかを判定する
 * @param partType - 判定するパーツタイプ
 * @returns カードまたはトークンの場合true
 */
export const isPhysicalPartType = (partType: string): boolean => {
  return partType === 'card' || partType === 'token';
};

/**
 * パーツタイプが概念的なパーツ（手札または山札）かどうかを判定する
 * @param partType - 判定するパーツタイプ
 * @returns 手札または山札の場合true
 */
export const isConceptPartType = (partType: string): boolean => {
  return partType === 'hand' || partType === 'deck';
};

/**
 * パーツの背景用の角丸半径を取得する
 * @param partType - パーツタイプ
 * @returns 角丸半径（ピクセル）
 */
export const getCornerRadius = (partType: string): number => {
  if (isConceptPartType(partType)) {
    return 20;
  }
  if (partType === 'card') {
    return 10;
  }
  return 4;
};

/**
 * パーツの画像用の角丸半径を取得する
 * @param partType - パーツタイプ
 * @returns 角丸半径（ピクセル）
 */
export const getImageCornerRadius = (partType: string): number => {
  if (partType === 'card') {
    return 10;
  }
  return 4;
};

/**
 * パーツの枠線幅を取得する
 * @param partType - パーツタイプ
 * @returns 枠線幅（ピクセル）
 */
export const getStrokeWidth = (partType: string): number => {
  return partType === 'area' ? 3 : 1;
};

/**
 * パーツの破線パターンを取得する
 * @param partType - パーツタイプ
 * @returns 破線パターン配列、または undefined（実線の場合）
 */
export const getDashPattern = (partType: string): number[] | undefined => {
  if (isConceptPartType(partType) || partType === 'area') {
    return [8, 8];
  }
  return undefined;
};

/**
 * パーツの影の色を取得する
 * @param partType - パーツタイプ
 * @param isActive - アクティブ状態かどうか
 * @returns 影の色
 */
export const getShadowColor = (partType: string, isActive: boolean): string => {
  if (isActive) {
    return 'rgba(59, 130, 246, 1)';
  }
  if (isPhysicalPartType(partType)) {
    return 'rgba(0, 0, 0, 0.15)';
  }
  return 'transparent';
};

/**
 * パーツの影のぼかし値を取得する
 * @param partType - パーツタイプ
 * @param isActive - アクティブ状態かどうか
 * @returns 影のぼかし値（ピクセル）
 */
export const getShadowBlur = (partType: string, isActive: boolean): number => {
  if (isActive) {
    return 10;
  }
  if (isPhysicalPartType(partType)) {
    return 4;
  }
  return 0;
};

/**
 * パーツの影のX軸オフセットを取得する
 * @param partType - パーツタイプ
 * @param isActive - アクティブ状態かどうか
 * @returns 影のX軸オフセット（ピクセル）
 */
export const getShadowOffsetX = (
  partType: string,
  isActive: boolean
): number => {
  if (isActive) {
    return 0;
  }
  if (isPhysicalPartType(partType)) {
    return 2;
  }
  return 0;
};

/**
 * パーツの影のY軸オフセットを取得する
 * @param partType - パーツタイプ
 * @param isActive - アクティブ状態かどうか
 * @returns 影のY軸オフセット（ピクセル）
 */
export const getShadowOffsetY = (
  partType: string,
  isActive: boolean
): number => {
  if (isActive) {
    return 0;
  }
  if (isPhysicalPartType(partType)) {
    return 2;
  }
  return 0;
};
