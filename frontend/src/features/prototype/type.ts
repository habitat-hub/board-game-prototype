// Partコンポーネントの外部から呼び出せる関数のインターフェース
export interface PartHandle {
  reverseCard: (isNextFlipped: boolean, needsSocketEmit: boolean) => void;
}

// パーツの移動順序
export enum MoveOrderType {
  BACK = 'back',
  FRONT = 'front',
  BACKMOST = 'backmost',
  FRONTMOST = 'frontmost',
}

// キャンバスのカメラ
export type Camera = {
  x: number;
  y: number;
  zoom: number;
};

// キャンバスのモード
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

// 座標
export type Point = {
  x: number;
  y: number;
};

// 矩形
export type XYWH = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// 辺
export enum Side {
  Top = 1,
  Bottom = 2,
  Left = 4,
  Right = 8,
}

// キャンバスの状態
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
