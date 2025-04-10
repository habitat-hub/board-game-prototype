import { PartDefaultConfig } from './type';

// バージョン番号
export const VERSION_NUMBER = {
  // マスター
  MASTER: '0.0.0',
};

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
    isReversible: false,
    configurableTypeAsChild: [],
  },
  // トークン
  TOKEN: {
    type: 'token',
    name: 'token',
    width: 50,
    height: 50,
    description: '',
    color: '#FFFFFF',
    textColor: '#000000',
    configurableTypeAsChild: [],
  },
  // 手札
  HAND: {
    type: 'hand',
    name: '手札',
    width: 400,
    height: 150,
    description: '',
    color: '#FFFFFF',
    textColor: '#000000',
    configurableTypeAsChild: ['card'],
  },
  // 山札
  DECK: {
    type: 'deck',
    name: '山札',
    width: 150,
    height: 150,
    description: '',
    color: '#FFFFFF',
    textColor: '#000000',
    configurableTypeAsChild: ['card'],
    canReverseCardOnDeck: false,
  },
  // エリア
  AREA: {
    type: 'area',
    name: 'エリア',
    width: 300,
    height: 200,
    description: '',
    color: '#FFFFFF',
    textColor: '#000000',
    configurableTypeAsChild: ['card', 'token', 'hand', 'deck'],
  },
};

// カラー
export const COLORS = [
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
];

// テキスト色
export const TEXT_COLORS = [
  '#FFFFFF', // White
  '#000000', // Black
];

// プレイヤー名の色
export const PLAYER_NAME_COLORS = [
  '#FFFFFF', // White
  '#808080', // Gray
  '#000000', // Black
];
