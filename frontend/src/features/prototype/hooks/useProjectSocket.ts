/**
 * @page プロジェクトレベルのSocket通信を行うカスタムフック
 */
import { useCallback, useEffect } from 'react';

import { Prototype } from '@/api/types';
import { SOCKET_EVENT } from '@/features/prototype/constants/socket';
import { useSocket } from '@/features/prototype/contexts/SocketContext';

interface UseProjectSocketProps {
  /** プロジェクトID */
  projectId: string;
  /** ユーザーID */
  userId: string | undefined;
  /** ルーム作成時のコールバック */
  onRoomCreated: (version: Prototype, instance: Prototype) => void;
  /** ルーム削除時のコールバック */
  onRoomDeleted: (
    deletedVersionId: string,
    deletedInstanceIds: string[]
  ) => void;
  /** ルーム別接続中ユーザー初期データ取得時のコールバック */
  onRoomConnectedUsers?: (
    roomUsers: Record<string, Array<{ userId: string; username: string }>>
  ) => void;
  /** ルーム別接続中ユーザー更新時のコールバック */
  onRoomConnectedUsersUpdate?: (
    prototypeId: string,
    users: Array<{ userId: string; username: string }>
  ) => void;
}

export const useProjectSocket = ({
  projectId,
  userId,
  onRoomCreated,
  onRoomDeleted,
  onRoomConnectedUsers,
  onRoomConnectedUsersUpdate,
}: UseProjectSocketProps) => {
  const { socket } = useSocket();

  // プロジェクトルームに参加
  const joinProject = useCallback(() => {
    if (!socket || !userId) return;

    socket.emit('JOIN_PROJECT', {
      projectId,
      userId,
    });
  }, [socket, projectId, userId]);

  // プロジェクトルームから退出
  const leaveProject = useCallback(() => {
    if (!socket) return;

    socket.emit('LEAVE_PROJECT', {
      projectId,
    });
  }, [socket, projectId]);

  // Socket通信の設定
  useEffect(() => {
    if (!socket || !userId) return;

    // プロジェクトルームに参加
    joinProject();

    // ルーム作成イベントを監視
    socket.on(
      SOCKET_EVENT.ROOM_CREATED,
      ({ version, instance }: { version: Prototype; instance: Prototype }) => {
        onRoomCreated(version, instance);
      }
    );

    // ルーム削除イベントを監視
    socket.on(
      SOCKET_EVENT.ROOM_DELETED,
      ({
        deletedVersionId,
        deletedInstanceIds,
      }: {
        deletedVersionId: string;
        deletedInstanceIds: string[];
      }) => {
        onRoomDeleted(deletedVersionId, deletedInstanceIds);
      }
    );

    // ルーム別接続中ユーザー初期データを監視
    socket.on(
      SOCKET_EVENT.ROOM_CONNECTED_USERS,
      (
        roomUsers: Record<string, Array<{ userId: string; username: string }>>
      ) => {
        onRoomConnectedUsers?.(roomUsers);
      }
    );

    // ルーム別接続中ユーザー更新を監視
    socket.on(
      SOCKET_EVENT.ROOM_CONNECTED_USERS_UPDATE,
      ({
        prototypeId,
        users,
      }: {
        prototypeId: string;
        users: Array<{ userId: string; username: string }>;
      }) => {
        onRoomConnectedUsersUpdate?.(prototypeId, users);
      }
    );

    return () => {
      // イベントリスナーを削除
      const events = [
        SOCKET_EVENT.ROOM_CREATED,
        SOCKET_EVENT.ROOM_DELETED,
        SOCKET_EVENT.ROOM_CONNECTED_USERS,
        SOCKET_EVENT.ROOM_CONNECTED_USERS_UPDATE,
      ];
      events.forEach((event) => socket.off(event));

      // プロジェクトルームから退出
      leaveProject();
    };
  }, [
    socket,
    joinProject,
    leaveProject,
    onRoomCreated,
    onRoomDeleted,
    onRoomConnectedUsers,
    onRoomConnectedUsersUpdate,
    userId,
  ]);

  return {
    joinProject,
    leaveProject,
  };
};
