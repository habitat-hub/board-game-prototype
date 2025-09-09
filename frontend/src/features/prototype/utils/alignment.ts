import { Part } from '@/api/types';
import { GAME_BOARD_SIZE } from '@/features/prototype/constants/gameBoard';

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

  // ベースサイズ合計（パーツそのものの幅/高さの合計）
  const baseSumSizes = sorted.reduce(
    (sum, p) => sum + (axis === 'horizontal' ? p.width : p.height),
    0
  );

  // ボード全体に収まるように、必要であれば gap を縮める（重なり＝負のギャップも許可）
  const boardSize = GAME_BOARD_SIZE;
  const count = sorted.length;
  const maxGap =
    count > 1 ? Math.floor((boardSize - baseSumSizes) / (count - 1)) : 0;
  // 要求ギャップが大きすぎてはみ出す場合は、最大許容ギャップ（maxGap）まで縮める。
  // maxGap は負にもなり得る（重なってでも収める）。
  const effectiveGap = Math.min(gap, maxGap);

  const totalSize = baseSumSizes + effectiveGap * (count - 1);

  // 展開開始位置を中央から計算し、ボード内に収める
  let startCoord =
    axis === 'horizontal'
      ? Math.round(info.centerX - totalSize / 2)
      : Math.round(info.centerY - totalSize / 2);
  // totalSize がボードより大きい場合は 0 から詰める。収まる場合は中央基準でクランプ
  startCoord =
    totalSize > boardSize
      ? 0
      : Math.max(0, Math.min(boardSize - totalSize, startCoord));

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

    current +=
      (axis === 'horizontal' ? p.width : p.height) + effectiveGap;
  });

  return updates;
};
