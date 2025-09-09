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

/** パーツ位置更新のバッチ要素 */
export type AlignmentUpdate = {
  partId: number;
  updatePart: { position: { x: number; y: number } };
};

/**
 * 選択されたパーツの位置に基づく整列情報を計算する
 * @param parts - 選択されたパーツ
 * @returns 整列情報、パーツが2つ未満の場合は null
 */
export const calculateAlignmentInfo = (parts: Part[]): AlignmentInfo | null => {
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
      (p) => Math.round(p.position.x + p.width / 2) === centerX
    ),
    isTop: parts.every((p) => p.position.y === minY),
    isBottom: parts.every((p) => p.position.y + p.height === maxY),
    isVCenter: parts.every(
      (p) => Math.round(p.position.y + p.height / 2) === centerY
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
  info: AlignmentInfo
): AlignmentUpdate[] =>
  parts
    .map((p) => {
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
        default: {
          // 将来 AlignmentType 追加時の網羅性チェック
          const _exhaustive: never = type;
          return _exhaustive as never;
        }
      }
      if (x === p.position.x && y === p.position.y) return null;
      return {
        partId: p.id,
        updatePart: {
          position: { ...p.position, x, y },
        },
      } as AlignmentUpdate | null;
    })
    .filter((u): u is AlignmentUpdate => u !== null);

export type DistributionAxis = 'horizontal' | 'vertical';

/**
 * 選択されたパーツを等間隔に配置するための更新を生成する
 * @param axis - 配置軸（horizontal | vertical）
 * @param parts - 選択されたパーツ
 * @param info - 整列情報
 * @returns パーツ更新オブジェクトの配列
 */
export const getEvenDistributionUpdates = (
  axis: DistributionAxis,
  parts: Part[],
  info: AlignmentInfo
): AlignmentUpdate[] => {
  const sorted = [...parts].sort((a, b) =>
    axis === 'horizontal'
      ? a.position.x - b.position.x
      : a.position.y - b.position.y
  );
  if (sorted.length < 2) return [];

  const totalSize = sorted.reduce(
    (sum, p) => sum + (axis === 'horizontal' ? p.width : p.height),
    0
  );
  const space =
    axis === 'horizontal'
      ? info.maxX - info.minX - totalSize
      : info.maxY - info.minY - totalSize;
  const gap = space / (sorted.length - 1);
  let current = axis === 'horizontal' ? info.minX : info.minY;

  return sorted.map((p) => {
    const x = axis === 'horizontal' ? Math.round(current) : p.position.x;
    const y = axis === 'vertical' ? Math.round(current) : p.position.y;
    current += (axis === 'horizontal' ? p.width : p.height) + gap;
    return {
      partId: p.id,
      updatePart: {
        position: { ...p.position, x, y },
      },
    };
  });
};
