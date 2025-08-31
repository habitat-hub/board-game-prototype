import { Part } from '@/api/types';

// パーツ種別（API の Part.type 相当）
export type PartType = Part['type'];

// 破線パターン
const DASH_PATTERN_DASHED: number[] = [8, 8];

// 影の設定値
const SHADOW_COLOR_PHYSICAL = 'rgba(0, 0, 0, 0.15)';
const SHADOW_BLUR_PHYSICAL = 4;
const SHADOW_OFFSET_PHYSICAL = 2;

// 各パーツ種別の見た目設定
// 新しいパーツ種別を追加する場合はこのオブジェクトに設定を記述するだけで、
// partUtils 内の各ヘルパー関数が自動的に参照します。
export type PartStyle = {
  cornerRadius: number;
  imageCornerRadius: number;
  strokeWidth: number;
  dashPattern?: number[];
  shadowColor: string;
  shadowBlur: number;
  shadowOffset: number;
};

const DEFAULT_STYLE: PartStyle = {
  cornerRadius: 4,
  imageCornerRadius: 4,
  strokeWidth: 1,
  shadowColor: 'transparent',
  shadowBlur: 0,
  shadowOffset: 0,
};

export const partTypeConfig: Record<PartType, Partial<PartStyle>> = {
  card: {
    cornerRadius: 10,
    imageCornerRadius: 10,
    shadowColor: SHADOW_COLOR_PHYSICAL,
    shadowBlur: SHADOW_BLUR_PHYSICAL,
    shadowOffset: SHADOW_OFFSET_PHYSICAL,
  },
  token: {
    shadowColor: SHADOW_COLOR_PHYSICAL,
    shadowBlur: SHADOW_BLUR_PHYSICAL,
    shadowOffset: SHADOW_OFFSET_PHYSICAL,
  },
  hand: {
    cornerRadius: 20,
    dashPattern: DASH_PATTERN_DASHED,
  },
  deck: {
    cornerRadius: 20,
    dashPattern: DASH_PATTERN_DASHED,
  },
  area: {
    strokeWidth: 3,
    dashPattern: DASH_PATTERN_DASHED,
  },
};

export const getPartStyle = (partType: PartType): PartStyle => ({
  ...DEFAULT_STYLE,
  ...(partTypeConfig[partType] ?? {}),
});

