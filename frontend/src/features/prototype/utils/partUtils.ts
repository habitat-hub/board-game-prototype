/**
 * パーツタイプが物理的なゲームピース（カードまたはトークン）かどうかを判定する
 * 物理的なパーツは影やその他の視覚効果を持つ
 * @param partType - 判定するパーツタイプ
 * @returns カードまたはトークンの場合true
 */
export const isPhysicalPartType = (partType: string): boolean => {
  return partType === 'card' || partType === 'token';
};

/**
 * パーツタイプが概念的なパーツ（手札または山札）かどうかを判定する
 * 概念的なパーツは枠線を持たず、ゲーム上の場所や状態を表す
 * @param partType - 判定するパーツタイプ
 * @returns 手札または山札の場合true
 */
export const isConceptPartType = (partType: string): boolean => {
  return partType === 'hand' || partType === 'deck';
};
