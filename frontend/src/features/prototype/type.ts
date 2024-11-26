export interface Prototype {
  id: number;
  name: string;
}

export interface Part {
  id: number;
  name: string;
  description: string;
  color: string;
  position: { x: number; y: number };
  width: number;
  height: number;
}

export interface Card extends Part {
  isFront: boolean;
}

export interface Hand extends Part {
  ownerId: string;
  cardIds: number[];
}

export interface Deck extends Part {
  cardIds: number[];
}
