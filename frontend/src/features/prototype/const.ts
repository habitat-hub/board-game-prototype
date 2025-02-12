export const PART_TYPE = {
  TOKEN: 'token',
  CARD: 'card',
  HAND: 'hand',
  DECK: 'deck',
};

export const PROTOTYPE_TYPE = {
  EDIT: 'EDIT',
  PREVIEW: 'PREVIEW',
};

export const VERSION_NUMBER = {
  MASTER: '0.0.0',
};

export const PART_DEFAULT_CONFIG = {
  CARD: {
    id: 'card',
    name: 'カード',
    width: 100,
    height: 150,
    description: '',
    color: '#FFFFFF',
    titleColor: '#000000',
    playerNameColor: '#000000',
    isReversible: false,
    configurableTypeAsChild: [],
  },
  TOKEN: {
    id: 'token',
    name: 'token',
    width: 50,
    height: 50,
    description: '',
    color: '#FFFFFF',
    titleColor: '#000000',
    playerNameColor: '#000000',
    configurableTypeAsChild: [],
  },
  HAND: {
    id: 'hand',
    name: '手札',
    width: 400,
    height: 150,
    description: '',
    color: '#FFFFFF',
    titleColor: '#000000',
    playerNameColor: '#000000',
    configurableTypeAsChild: ['card'],
  },
  DECK: {
    id: 'deck',
    name: '山札',
    width: 150,
    height: 150,
    description: '',
    color: '#FFFFFF',
    titleColor: '#000000',
    playerNameColor: '#000000',
    configurableTypeAsChild: ['card'],
    canReverseCardOnDeck: false,
  },
};

export const COLORS = [
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
];

export const TITLE_COLORS = [
  '#FFFFFF', // White
  '#9932CC', // Purple
  '#00FFFF', // Sky Blue
  '#000000', // Black
];

export const PLAYER_NAME_COLORS = [
  '#FFFFFF', // White
  '#9932CC', // Purple
  '#00FFFF', // Sky Blue
  '#000000', // Black
];
