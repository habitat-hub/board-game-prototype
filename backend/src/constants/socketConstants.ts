/**
 * Socket.io標準の接続関連イベント名の定数
 */
export const COMMON_SOCKET_EVENT = {
  // 接続エラー発生時
  CONNECT_ERROR: 'connect_error',
  // 切断時
  DISCONNECT: 'disconnect',
} as const;

/**
 * プロトタイプレベルのソケットイベント名の定数
 * 特定のプロトタイプ内での操作に関するイベント
 */
export const PROTOTYPE_SOCKET_EVENT = {
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
 * プロジェクトレベルのソケットイベント名の定数
 * プロジェクト全体での操作に関するイベント（ルーム管理など）
 */
export const PROJECT_SOCKET_EVENT = {
  // プロジェクトへの参加
  JOIN_PROJECT: 'JOIN_PROJECT',
  // プロジェクトからの退出
  LEAVE_PROJECT: 'LEAVE_PROJECT',
  // ルーム作成
  ROOM_CREATED: 'ROOM_CREATED',
  // ルーム削除
  ROOM_DELETED: 'ROOM_DELETED',
  // ルーム別接続中ユーザー初期データ
  ROOM_CONNECTED_USERS: 'ROOM_CONNECTED_USERS',
  // ルーム別接続中ユーザー更新
  ROOM_CONNECTED_USERS_UPDATE: 'ROOM_CONNECTED_USERS_UPDATE',
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
