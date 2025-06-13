export const PROTOTYPE_VERSION = {
  INITIAL: 0,
};

export const ACCESS_TYPE = {
  MASTER: 'MASTER',
};

export const UPDATABLE_PROTOTYPE_FIELDS = {
  PROTOTYPE: ['name', 'minPlayers', 'maxPlayers'],
  PART: [
    'parentId',
    'name',
    'description',
    'color',
    'textColor',
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
