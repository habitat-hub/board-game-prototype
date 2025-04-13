// カーソル情報の型定義
export interface CursorInfo {
  // ユーザーID
  userId: string;
  // ユーザー名
  userName: string;
  // カーソルの位置
  position: {
    x: number;
    y: number;
  };
}

// カーソル情報のマップ
export type CursorMap = Record<string, CursorInfo>;
