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
