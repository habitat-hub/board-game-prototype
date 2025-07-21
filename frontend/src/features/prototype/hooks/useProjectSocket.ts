/**
 * @page プロジェクトレベルのSocket通信を行うカスタムフック
 */
import { useCallback, useEffect } from 'react';

import { Prototype } from '@/api/types';
import { useSocket } from '@/features/prototype/contexts/SocketContext';

interface UseProjectSocketProps {
  /** プロジェクトID */
  projectId: string;
  /** ユーザーID */
  userId: string;
  /** ルーム作成時のコールバック */
  onRoomCreated: (version: Prototype, instance: Prototype) => void;
  /** ルーム削除時のコールバック */
  onRoomDeleted: (
    deletedVersionId: string,
    deletedInstanceIds: string[]
  ) => void;
}

export const useProjectSocket = ({
  projectId,
  userId,
  onRoomCreated,
  onRoomDeleted,
}: UseProjectSocketProps) => {
  const { socket } = useSocket();

  // プロジェクトルームに参加
  const joinProject = useCallback(() => {
    if (!socket) return;

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
    if (!socket) return;

    // プロジェクトルームに参加
    joinProject();

    // ルーム作成イベントを監視
    socket.on(
      'ROOM_CREATED',
      ({ version, instance }: { version: Prototype; instance: Prototype }) => {
        onRoomCreated(version, instance);
      }
    );

    // ルーム削除イベントを監視
    socket.on(
      'ROOM_DELETED',
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

    return () => {
      // イベントリスナーを削除
      socket.off('ROOM_CREATED');
      socket.off('ROOM_DELETED');

      // プロジェクトルームから退出
      leaveProject();
    };
  }, [socket, joinProject, leaveProject, onRoomCreated, onRoomDeleted]);

  return {
    joinProject,
    leaveProject,
  };
};
