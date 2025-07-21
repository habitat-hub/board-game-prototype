import { Server } from 'socket.io';

/**
 * Socket.IOインスタンス管理ユーティリティ
 *
 * このモジュールはREST API -> Socket.IO通信パターンを実現するためのグローバル管理ツールです。
 * 通常のSocket.IO通信（Socket -> Socket）とは異なり、REST APIルート内からSocket.IOクライアントに
 * イベントを送信する必要がある場合に使用します。
 *
 * 使用例:
 * - プロジェクト作成後にリアルタイム通知を送信
 * - REST APIでのデータ更新をSocket.IOで全ユーザーに同期
 */

let ioInstance: Server | null = null;

/**
 * Socket.IOインスタンスを設定
 * サーバー起動時にserver.tsから呼び出されます
 *
 * @param io - Socket.IOサーバーインスタンス
 */
export const setIOInstance = (io: Server) => {
  ioInstance = io;
};

/**
 * Socket.IOインスタンスを取得
 * REST APIルート内でSocket.IOイベントを発行する際に使用します
 *
 * @returns Socket.IOサーバーインスタンス
 * @throws {Error} インスタンスが初期化されていない場合
 */
export const getIOInstance = (): Server => {
  if (!ioInstance) {
    throw new Error('Socket.IO instance not initialized');
  }
  return ioInstance;
};
