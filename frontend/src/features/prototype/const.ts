// パーツタイプ
export const PART_TYPE = {
  TOKEN: 'token',
  CARD: 'card',
  HAND: 'hand',
  DECK: 'deck',
  AREA: 'area',
};

// バージョン番号
export const VERSION_NUMBER = {
  // マスター
  MASTER: '0.0.0',
};

// パーツのデフォルト設定
export const PART_DEFAULT_CONFIG = {
  // カード
  CARD: {
    id: 'card',
    name: 'カード',
    width: 100,
    height: 150,
    description: '',
    color: '#FFFFFF',
    isReversible: false,
    configurableTypeAsChild: [],
  },
  // トークン
  TOKEN: {
    id: 'token',
    name: 'token',
    width: 50,
    height: 50,
    description: '',
    color: '#FFFFFF',
    configurableTypeAsChild: [],
  },
  // 手札
  HAND: {
    id: 'hand',
    name: '手札',
    width: 400,
    height: 150,
    description: '',
    color: '#FFFFFF',
    configurableTypeAsChild: ['card'],
  },
  // 山札
  DECK: {
    id: 'deck',
    name: '山札',
    width: 150,
    height: 150,
    description: '',
    color: '#FFFFFF',
    configurableTypeAsChild: ['card'],
    canReverseCardOnDeck: false,
  },
  // エリア
  AREA: {
    id: 'area',
    name: 'エリア',
    width: 300,
    height: 200,
    description: '',
    color: '#FFFFFF',
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
