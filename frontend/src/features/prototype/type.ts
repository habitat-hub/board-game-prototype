import { Part, PartProperty, Image } from '@/api/types';

// Partコンポーネントの外部から呼び出せる関数のインターフェース
export interface PartHandle {
  reverseCard: (
    nextFrontSide: 'front' | 'back',
    needsSocketEmit?: boolean
  ) => void;
}

// パーツのデフォルト設定
export interface PartDefaultConfig {
  type: 'card' | 'token' | 'hand' | 'deck' | 'area';
  name: string;
  width: number;
  height: number;
  description: string;
  textColor: string;
  color: string;
  // カード専用フィールド（optional）
  frontDescription?: string;
  backDescription?: string;
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

// パーツを追加時のprops
export interface AddPartProps {
  part: Omit<Part, 'id' | 'prototypeId' | 'order' | 'createdAt' | 'updatedAt'>;
  properties: Omit<PartProperty, 'id' | 'createdAt' | 'updatedAt' | 'partId'>[];
}

// PartPropertyにImageを追加した型
export interface PartPropertyWithImage extends PartProperty {
  image?: Image; // Imageはオプショナル
}

// プロパティ更新用の型定義（imageIdにnullを許容）
export type PartPropertyUpdate = Omit<Partial<PartProperty>, 'imageId'> & {
  imageId?: string | null;
};

// 画像削除時のprops
export interface DeleteImageProps {
  imageId: string;
  partId: number;
  side: 'front' | 'back';
  prototypeId: string;
  emitUpdate: 'true' | 'false';
}
