import { Part } from '@/api/types';
import { GAME_BOARD_SIZE } from '@/features/prototype/constants';

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

/**
 * 選択されたパーツを横または縦方向に並べて展開するための更新を生成する
 * @param axis - 展開軸（horizontal | vertical）
 * @param parts - 選択されたパーツ
 * @param info - 整列情報
 * @param gap - パーツ間の隙間(px)
 * @returns パーツ更新オブジェクトの配列
 */
export const getSpreadUpdates = (
  axis: DistributionAxis,
  parts: Part[],
  info: AlignmentInfo,
  gap = 20
): AlignmentUpdate[] => {
  const sorted = [...parts].sort((a, b) =>
    axis === 'horizontal'
      ? a.position.x - b.position.x
      : a.position.y - b.position.y
  );
  if (sorted.length === 0) return [];

  const totalSize =
    sorted.reduce(
      (sum, p) => sum + (axis === 'horizontal' ? p.width : p.height),
      0
    ) +
    gap * (sorted.length - 1);

  // 展開開始位置を中央から計算し、ボード内に収める
  let startCoord =
    axis === 'horizontal'
      ? Math.round(info.centerX - totalSize / 2)
      : Math.round(info.centerY - totalSize / 2);
  startCoord = Math.max(0, Math.min(GAME_BOARD_SIZE - totalSize, startCoord));

  const updates: AlignmentUpdate[] = [];
  let current = startCoord;
  sorted.forEach((p) => {
    const x =
      axis === 'horizontal' ? current : Math.round(info.centerX - p.width / 2);
    const y =
      axis === 'vertical' ? current : Math.round(info.centerY - p.height / 2);

    // ボード内に収める
    const clampedX = Math.max(0, Math.min(GAME_BOARD_SIZE - p.width, x));
    const clampedY = Math.max(0, Math.min(GAME_BOARD_SIZE - p.height, y));

    if (clampedX !== p.position.x || clampedY !== p.position.y) {
      updates.push({
        partId: p.id,
        updatePart: {
          position: { ...p.position, x: clampedX, y: clampedY },
        },
      });
    }

    current += (axis === 'horizontal' ? p.width : p.height) + gap;
  });

  return updates;
};
