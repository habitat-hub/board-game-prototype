import { PartDefaultConfig } from '@/features/prototype/types';

/**
 * パーツのカラー定義
 */
export const COLORS = {
  /** 背景色 */
  BACKGROUNDS: [
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#800080', // Purple
    '#008000', // Dark Green
    '#FFC0CB', // Pink
    '#FFFFFF', // White
    '#808080', // Gray
  ],
  /** テキスト色 */
  TEXT: [
    '#FFFFFF', // White
    '#000000', // Black
  ],
};

/** テキストレイアウト設定 */
export const TEXT_LAYOUT = {
  /** テキスト行間のギャップ */
  LINE_GAP: 14,
  /** テキストの左右マージン */
  HORIZONTAL_MARGIN: 10,
} as const;

// パーツのデフォルト設定
export const PART_DEFAULT_CONFIG: Record<string, PartDefaultConfig> = {
  // カード
  CARD: {
    type: 'card',
    name: 'カード',
    width: 100,
    height: 150,
    description: '',
    color: '#FFFFFF',
    textColor: '#000000',
    frontDescription: '',
    backDescription: '',
  },
  // トークン
  TOKEN: {
    type: 'token',
    name: 'トークン',
    width: 50,
    height: 50,
    description: '',
    color: '#FFFFFF',
    textColor: '#000000',
  },
  // 手札
  HAND: {
    type: 'hand',
    name: '手札',
    width: 400,
    height: 200,
    description: '',
    color: '#FFFFFF',
    textColor: '#000000',
  },
  // 山札
  DECK: {
    type: 'deck',
    name: '山札',
    width: 250,
    height: 250,
    description: '',
    color: '#FFFFFF',
    textColor: '#000000',
  },
  // エリア
  AREA: {
    type: 'area',
    name: 'エリア',
    width: 300,
    height: 300,
    description: '',
    color: '#FFFFFF',
    textColor: '#000000',
  },
};
