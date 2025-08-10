/**
 * ソケット通信で使用するイベント名の定数
 */
export const SOCKET_EVENT = {
  // 接続エラー発生時
  CONNECT_ERROR: 'connect_error',
  // 切断時
  DISCONNECT: 'disconnect',
  // プロトタイプへの参加
  JOIN_PROTOTYPE: 'JOIN_PROTOTYPE',
  // 初期パーツ情報の送信
  INITIAL_PARTS: 'INITIAL_PARTS',
  // パーツ追加リクエスト
  ADD_PART: 'ADD_PART',
  // パーツ追加レスポンス
  ADD_PART_RESPONSE: 'ADD_PART_RESPONSE',
  // パーツ情報の更新
  UPDATE_PARTS: 'UPDATE_PARTS',
  // パーツ削除
  DELETE_PART: 'DELETE_PART',
  // カーソル情報の更新
  UPDATE_CURSORS: 'UPDATE_CURSORS',
  // 接続中ユーザーリストの更新
  CONNECTED_USERS: 'CONNECTED_USERS',
} as const;

/**
 * サーバー側からの切断理由の定数
 */
export const SOCKET_DISCONNECT_REASON = {
  // サーバーによる切断
  IO_SERVER_DISCONNECT: 'io server disconnect',
  // 通信エラーによる切断
  TRANSPORT_ERROR: 'transport error',
} as const;

/**
 * 想定外の切断理由をまとめたセット
 */
export const UNEXPECTED_DISCONNECT_REASONS = new Set<string>([
  SOCKET_DISCONNECT_REASON.IO_SERVER_DISCONNECT,
  SOCKET_DISCONNECT_REASON.TRANSPORT_ERROR,
]);
