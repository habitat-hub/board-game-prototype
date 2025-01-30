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

export const PROTOTYPE_VERSION = {
  INITIAL: '0.0.0',
};

export const UPDATABLE_PROTOTYPE_FIELDS = {
  PROTOTYPE: ['name', 'minPlayers', 'maxPlayers'],
  PART: [
    'parentId',
    'name',
    'description',
    'color',
    'titleColor',
    'playerColor',
    'position',
    'width',
    'height',
    'isReversible',
    'isFlipped',
    'ownerId',
    'originalPartId',
    'canReverseCardOnDeck',
  ],
};

export enum MoveOrderType {
  BACK = 'back',
  FRONT = 'front',
  BACKMOST = 'backmost',
  FRONTMOST = 'frontmost',
}
