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
