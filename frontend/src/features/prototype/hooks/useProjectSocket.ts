/**
 * @page プロジェクトレベルのSocket通信を行うカスタムフック
 */
import { useCallback, useEffect, useState } from 'react';

import { Prototype } from '@/api/types';
import { PROJECT_SOCKET_EVENT } from '@/features/prototype/constants/socket';
import { useSocket } from '@/features/prototype/contexts/SocketContext';
import { ConnectedUser } from '@/features/prototype/types/livePrototypeInformation';

interface UseProjectSocketProps {
  /** プロジェクトID */
  projectId: string;
  /** ユーザーID */
  userId: string | undefined;
  /** 初期プロトタイプリスト */
  initialPrototypes?: Prototype[];
}

export const useProjectSocket = ({
  projectId,
  userId,
  initialPrototypes = [],
}: UseProjectSocketProps) => {
  const { socket } = useSocket();

  // プロトタイプリストの状態管理
  const [prototypes, setPrototypes] = useState<Prototype[]>(initialPrototypes);

  // ルーム別接続中ユーザーの状態管理
  const [roomConnectedUsers, setRoomConnectedUsers] = useState<
    Record<string, ConnectedUser[]>
  >({});

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

  // ルーム作成時の内部処理
  const handleRoomCreated = useCallback(
    (version: Prototype, instance: Prototype) => {
      setPrototypes((prev) => [...prev, version, instance]);
    },
    []
  );

  // ルーム削除時の内部処理
  const handleRoomDeleted = useCallback(
    (deletedVersionId: string, deletedInstanceIds: string[]) => {
      setPrototypes((prev) =>
        prev.filter(
          (prototype) =>
            prototype.id !== deletedVersionId &&
            !deletedInstanceIds.includes(prototype.id)
        )
      );
    },
    []
  );

  // ルーム別接続中ユーザー初期データ取得時の内部処理
  const handleRoomConnectedUsers = useCallback(
    (
      roomUsers: Record<string, Array<{ userId: string; username: string }>>
    ) => {
      setRoomConnectedUsers(roomUsers);
    },
    []
  );

  // ルーム別接続中ユーザー更新時の内部処理
  const handleRoomConnectedUsersUpdate = useCallback(
    (
      prototypeId: string,
      users: Array<{ userId: string; username: string }>
    ) => {
      setRoomConnectedUsers((prev) => ({
        ...prev,
        [prototypeId]: users,
      }));
    },
    []
  );

  // プロトタイプリストを更新する関数（外部からの更新用）
  const updatePrototypes = useCallback((newPrototypes: Prototype[]) => {
    setPrototypes(newPrototypes);
  }, []);

  // Socket通信の設定
  useEffect(() => {
    if (!socket || !userId) return;

    // プロジェクトルームに参加
    joinProject();

    // ルーム作成イベントを監視
    socket.on(
      PROJECT_SOCKET_EVENT.ROOM_CREATED,
      ({ version, instance }: { version: Prototype; instance: Prototype }) => {
        handleRoomCreated(version, instance);
      }
    );

    // ルーム削除イベントを監視
    socket.on(
      PROJECT_SOCKET_EVENT.ROOM_DELETED,
      ({
        deletedVersionId,
        deletedInstanceIds,
      }: {
        deletedVersionId: string;
        deletedInstanceIds: string[];
      }) => {
        handleRoomDeleted(deletedVersionId, deletedInstanceIds);
      }
    );

    // ルーム別接続中ユーザー初期データを監視
    socket.on(
      PROJECT_SOCKET_EVENT.ROOM_CONNECTED_USERS,
      (
        roomUsers: Record<string, Array<{ userId: string; username: string }>>
      ) => {
        handleRoomConnectedUsers(roomUsers);
      }
    );

    // ルーム別接続中ユーザー更新を監視
    socket.on(
      PROJECT_SOCKET_EVENT.ROOM_CONNECTED_USERS_UPDATE,
      ({
        prototypeId,
        users,
      }: {
        prototypeId: string;
        users: Array<{ userId: string; username: string }>;
      }) => {
        handleRoomConnectedUsersUpdate(prototypeId, users);
      }
    );

    return () => {
      // イベントリスナーを削除
      const events = [
        PROJECT_SOCKET_EVENT.ROOM_CREATED,
        PROJECT_SOCKET_EVENT.ROOM_DELETED,
        PROJECT_SOCKET_EVENT.ROOM_CONNECTED_USERS,
        PROJECT_SOCKET_EVENT.ROOM_CONNECTED_USERS_UPDATE,
      ];
      events.forEach((event) => socket.off(event));

      // プロジェクトルームから退出
      leaveProject();
    };
  }, [
    socket,
    joinProject,
    leaveProject,
    handleRoomCreated,
    handleRoomDeleted,
    handleRoomConnectedUsers,
    handleRoomConnectedUsersUpdate,
    userId,
  ]);

  return {
    prototypes,
    roomConnectedUsers,
    joinProject,
    leaveProject,
    updatePrototypes,
  };
};
