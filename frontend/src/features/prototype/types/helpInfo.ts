/**
 * ヘルプ情報に関する型定義
 */

// ショートカット情報の型
export type ShortcutInfo = {
  // ID
  id: string;
  // ショートカットキー
  key: string;
  // 説明
  description: string;
};

// パーツ情報の型
export type PartInfo = {
  // パーツID
  id: string;
  // パーツ名
  name: string;
  // 説明
  description: string;
};

// 操作方法の型
export type OperationInfo = {
  // ID
  id: string;
  // 操作概要
  operation: string;
  // 説明
  description: string;
};
