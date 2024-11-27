export interface Prototype {
  id: number;
  name: string;
  playerCount: number;
}

export type AllPart = Part | Card | Hand | Deck;
export type AllPartKey = keyof Part | keyof Card | keyof Hand | keyof Deck;

export interface Part {
  id: number;
  prototypeId: number;
  name: string;
  description: string;
  color: string;
  position: { x: number; y: number };
  width: number;
  height: number;
}

export interface Card extends Part {
  isReversible: boolean;
}

export interface Hand extends Part {
  ownerId: string;
  cardIds: number[];
}

export interface Deck extends Part {
  cardIds: number[];
}
