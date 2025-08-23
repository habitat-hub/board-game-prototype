import { PartDefaultConfig } from '@/features/prototype/types';

/**
 * パーツ作成時の連打防止用スリープ時間（ミリ秒）
 */
export const PART_CREATE_THROTTLE_MS = 300;

/**
 * パーツの配置を試行する最大回数
 */
export const POSITION_ATTEMPTS: number = 50;

/**
 * パーツの配置時のX方向のオフセット量
 */
export const OFFSET_STEP_X: number = 25;

/**
 * パーツのカラー定義
 */
export const COLORS = {
  /** 背景色 */
  BACKGROUNDS: [
    '#FFB3B3', // Soft Red (パステルレッド)
    '#B3E5B3', // Soft Green (パステルグリーン)
    '#B3D9FF', // Soft Blue (パステルブルー)
    '#FFF5B3', // Soft Yellow (パステルイエロー)
    '#B3F0F0', // Soft Cyan (パステルシアン)
    '#FFD9B3', // Soft Orange (パステルオレンジ)
    '#D9B3D9', // Soft Purple (パステルパープル)
    '#C7E6C7', // Soft Dark Green (パステルダークグリーン)
    '#F0E6F0', // Very Soft Pink (極薄ピンク)
    '#FFFFFF', // White (ホワイト)
  ],
  /** テキスト色 */
  TEXT: [
    '#000000', // Black (黒)
    '#404040', // Dark Gray (ダークグレー)
    '#808080', // Gray (グレー)
    '#BFBFBF', // Light Gray (ライトグレー)
    '#FFFFFF', // White (白)
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
