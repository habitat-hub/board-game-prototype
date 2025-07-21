import { Server, Socket } from 'socket.io';
import PrototypeModel from '../models/Prototype';
import { hasPermission } from '../helpers/roleHelper';
import { RESOURCE_TYPES, PERMISSION_ACTIONS } from '../const';

// socket.dataの型定義
interface ProjectSocketData {
  projectId?: string;
  userId: string;
  prototypeId?: string;
}

/**
 * プロジェクト参加
 * @param socket - Socket
 */
function handleJoinProject(socket: Socket) {
  socket.on(
    'JOIN_PROJECT',
    async ({ projectId, userId }: { projectId: string; userId: string }) => {
      try {
        // プロジェクトへの読み取り権限をチェック
        const hasAccess = await hasPermission(
          userId,
          RESOURCE_TYPES.PROJECT,
          PERMISSION_ACTIONS.READ,
          projectId
        );

        if (!hasAccess) {
          console.warn(
            `User ${userId} attempted to join project ${projectId} without permission`
          );
          socket.emit('ERROR', {
            message: 'プロジェクトへのアクセス権限がありません',
          });
          return;
        }

        // socket.dataにprojectIdとuserIdを設定
        socket.data = {
          ...socket.data,
          projectId,
          userId,
        } as ProjectSocketData;

        // プロジェクトルームに参加
        socket.join(`project:${projectId}`);

        console.log(
          `User ${userId} successfully joined project ${projectId} room`
        );
      } catch (error) {
        console.error('プロジェクトの参加に失敗しました。', error);
        socket.emit('ERROR', {
          message: 'プロジェクトへの参加に失敗しました',
        });
      }
    }
  );
}

/**
 * ルーム作成通知
 * @param socket - Socket
 * @param io - Server
 */
function handleRoomCreated(socket: Socket, io: Server) {
  socket.on(
    'ROOM_CREATED',
    async ({
      projectId,
      versionPrototype,
      instancePrototype,
    }: {
      projectId: string;
      versionPrototype: PrototypeModel;
      instancePrototype: PrototypeModel;
    }) => {
      try {
        // プロジェクトルーム内の全ユーザーにルーム作成を通知
        io.to(`project:${projectId}`).emit('ROOM_CREATED', {
          version: versionPrototype,
          instance: instancePrototype,
        });
      } catch (error) {
        console.error('ルーム作成通知に失敗しました。', error);
      }
    }
  );
}

/**
 * ルーム削除通知
 * @param socket - Socket
 * @param io - Server
 */
function handleRoomDeleted(socket: Socket, io: Server) {
  socket.on(
    'ROOM_DELETED',
    async ({
      projectId,
      deletedVersionId,
      deletedInstanceIds,
    }: {
      projectId: string;
      deletedVersionId: string;
      deletedInstanceIds: string[];
    }) => {
      try {
        // プロジェクトルーム内の全ユーザーにルーム削除を通知
        io.to(`project:${projectId}`).emit('ROOM_DELETED', {
          deletedVersionId,
          deletedInstanceIds,
        });
      } catch (error) {
        console.error('ルーム削除通知に失敗しました。', error);
      }
    }
  );
}

/**
 * プロジェクト退出
 * @param socket - Socket
 */
function handleLeaveProject(socket: Socket) {
  socket.on('LEAVE_PROJECT', ({ projectId }: { projectId: string }) => {
    try {
      socket.leave(`project:${projectId}`);
    } catch (error) {
      console.error('プロジェクトからの退出に失敗しました。', error);
    }
  });
}

export default function handleProject(socket: Socket, io: Server) {
  handleJoinProject(socket);
  handleRoomCreated(socket, io);
  handleRoomDeleted(socket, io);
  handleLeaveProject(socket);

  socket.on('disconnect', () => {
    const { projectId, userId } = socket.data as ProjectSocketData;
    if (projectId && userId) {
      // プロジェクト切断時の処理
      console.log(
        `ユーザー ${userId} がプロジェクト ${projectId} から切断されました`
      );
      // 必要に応じて他のプロジェクトメンバーに通知可能
      // io.to(`project:${projectId}`).emit('USER_DISCONNECTED', { userId });
    }
  });
}
