import { Part } from '@/api/types';

export type AlignmentType =
  | 'left'
  | 'right'
  | 'hCenter'
  | 'top'
  | 'bottom'
  | 'vCenter';

export type AlignmentInfo = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
  isLeft: boolean;
  isRight: boolean;
  isHCenter: boolean;
  isTop: boolean;
  isBottom: boolean;
  isVCenter: boolean;
};

/**
 * 選択されたパーツの位置に基づく整列情報を計算する
 * @param parts - 選択されたパーツ
 * @returns 整列情報、パーツが2つ未満の場合は null
 */
export const calculateAlignmentInfo = (
  parts: Part[],
): AlignmentInfo | null => {
  if (parts.length < 2) return null;

  const minX = Math.min(...parts.map((p) => p.position.x));
  const maxX = Math.max(...parts.map((p) => p.position.x + p.width));
  const minY = Math.min(...parts.map((p) => p.position.y));
  const maxY = Math.max(...parts.map((p) => p.position.y + p.height));
  const centerX = Math.round((minX + maxX) / 2);
  const centerY = Math.round((minY + maxY) / 2);

  return {
    minX,
    maxX,
    minY,
    maxY,
    centerX,
    centerY,
    isLeft: parts.every((p) => p.position.x === minX),
    isRight: parts.every((p) => p.position.x + p.width === maxX),
    isHCenter: parts.every(
      (p) => Math.round(p.position.x + p.width / 2) === centerX,
    ),
    isTop: parts.every((p) => p.position.y === minY),
    isBottom: parts.every((p) => p.position.y + p.height === maxY),
    isVCenter: parts.every(
      (p) => Math.round(p.position.y + p.height / 2) === centerY,
    ),
  };
};

/**
 * 指定された整列タイプに基づいてパーツの更新を生成する
 * @param type - 整列タイプ
 * @param parts - 選択されたパーツ
 * @param info - 整列情報
 * @returns パーツ更新オブジェクトの配列
 */
export const getAlignmentUpdates = (
  type: AlignmentType,
  parts: Part[],
  info: AlignmentInfo,
) =>
  parts.map((p) => {
    let x = p.position.x;
    let y = p.position.y;
    switch (type) {
      case 'left':
        x = info.minX;
        break;
      case 'right':
        x = info.maxX - p.width;
        break;
      case 'hCenter':
        x = Math.round(info.centerX - p.width / 2);
        break;
      case 'top':
        y = info.minY;
        break;
      case 'bottom':
        y = info.maxY - p.height;
        break;
      case 'vCenter':
        y = Math.round(info.centerY - p.height / 2);
        break;
    }
    return {
      partId: p.id,
      updatePart: {
        position: { ...p.position, x, y },
      },
    };
  });
