export interface Prototype {
  id: number;
  name: string;
}

export interface Part {
  id: number;
  name: string;
  position: { x: number; y: number };
}
