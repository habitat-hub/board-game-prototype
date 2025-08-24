/**
 * コンテキストメニューの項目（UI側で実行されるアクションを保持）
 */
export type ContextMenuItem = {
  id: string;
  text: string;
  action: () => void;
};
