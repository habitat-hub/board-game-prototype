export interface Prototype {
  id: number;
  userId: number;
  groupId: number;
  name: string;
  isPreview: boolean;
  players: Player[];
}

export type AllPart = Part | Card | Hand;
export type AllPartKey = keyof Part | keyof Card | keyof Hand;

export interface Part {
  id: number;
  type: string;
  prototypeId: number;
  parentId: number | null;
  name: string;
  description: string;
  color: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  order: number; // @see https://www.figma.com/blog/realtime-editing-of-ordered-sequences/ , https://www.wantedly.com/companies/wantedly/post_articles/386188
  configurableTypeAsChild: string[];
}

export interface Card extends Part {
  isReversible: boolean;
}

export interface Hand extends Part {
  ownerId: string;
}

export interface Player {
  id: string;
  name: string;
}
