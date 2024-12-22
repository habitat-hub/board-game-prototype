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
  MASTER: '0',
};

export const PART_DEFAULT_CONFIG = {
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
  TOKEN: {
    id: 'token',
    name: 'token',
    width: 50,
    height: 50,
    description: '',
    color: '#FFFFFF',
    configurableTypeAsChild: [],
  },
  HAND: {
    id: 'hand',
    name: '手札',
    width: 400,
    height: 150,
    description: '',
    color: '#FFFFFF',
    configurableTypeAsChild: ['card'],
  },
  DECK: {
    id: 'deck',
    name: '山札',
    width: 150,
    height: 150,
    description: '',
    color: '#FFFFFF',
    configurableTypeAsChild: ['card'],
  },
};

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
