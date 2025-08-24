/** キャンバスサイズ型 */
export type CanvasSize = {
  /** 幅 */
  width: number;
  /** 高さ */
  height: number;
};

/** ゲームボードモード */
export enum GameBoardMode {
  /** 作成モード */
  CREATE = 'create',
  /** プレビューモード */
  PREVIEW = 'preview',
  /** プレイモード */
  PLAY = 'play',
}

export type Position = {
  x: number;
  y: number;
};
