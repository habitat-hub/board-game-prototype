import { PROTOTYPE_TYPE } from './const';

export interface Prototype {
  id: number;
  userId: number;
  name: string;
  type: typeof PROTOTYPE_TYPE.EDIT | typeof PROTOTYPE_TYPE.PREVIEW;
  groupId: number;
  masterPrototypeId: number | null;
  minPlayers: number;
  maxPlayers: number;
}

export interface PrototypeVersion {
  id: string;
  prototypeId: string;
  versionNumber: string;
  description: string;
}

export type AllPart = Part | Card | Hand | Deck;
export type AllPartKey = keyof Part | keyof Card | keyof Hand | keyof Deck;

export interface Part {
  id: number;
  type: string;
  prototypeVersionId: string;
  parentId: number | null;
  name: string;
  description: string;
  color: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  order: number; // @see https://www.figma.com/blog/realtime-editing-of-ordered-sequences/ , https://www.wantedly.com/companies/wantedly/post_articles/386188
  configurableTypeAsChild: string[];
  originalPartId: number | null;
}

export interface Card extends Part {
  isReversible: boolean;
  isFlipped: boolean;
}

export interface Hand extends Part {
  ownerId: number;
}

export interface Deck extends Part {
  canReverseCardOnDeck: boolean;
}

export interface Player {
  id: number;
  prototypeVersionId: string;
  playerName: string;
}

export interface User {
  id: string;
  username: string;
}

export type Camera = {
  x: number;
  y: number;
  zoom: number;
};
export enum CanvasMode {
  None,
  Dragging,
  Inserting,
  Pencil,
  Resizing,
  Translating,
  SelectionNet,
  Pressing,
  RightClick,
}

export type Point = {
  x: number;
  y: number;
};

export type XYWH = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export enum Side {
  Top = 1,
  Bottom = 2,
  Left = 4,
  Right = 8,
}

export type CanvasState =
  | {
      mode: CanvasMode.None;
    }
  | {
      mode: CanvasMode.RightClick;
    }
  | {
      mode: CanvasMode.SelectionNet;
      origin: Point;
      current?: Point;
    }
  | {
      mode: CanvasMode.Dragging;
      origin: Point | null;
    }
  | {
      mode: CanvasMode.Pencil;
    }
  | {
      mode: CanvasMode.Resizing;
      initialBounds: XYWH;
      corner: Side;
    }
  | {
      mode: CanvasMode.Translating;
      current: Point;
    }
  | {
      mode: CanvasMode.Pressing;
      origin: Point;
    };
