'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { IoArrowBack, IoMenu, IoAdd } from 'react-icons/io5';
import { MdMeetingRoom, MdDelete } from 'react-icons/md';

import { useProject } from '@/api/hooks/useProject';
import { Prototype, ProjectsDetailData } from '@/api/types';
import { GameBoardMode } from '@/features/prototype/types';
import formatDate from '@/utils/dateFormat';

import GameBoardInstructionPanel from './GameBoardInstructionPanel';

export default function LeftSidebar({
  prototypeName,
  gameBoardMode,
  projectId,
}: {
  prototypeName: string;
  gameBoardMode: GameBoardMode;
  projectId: string;
}) {
  const router = useRouter();
  const { getProject, createPrototypeVersion, deletePrototypeVersion } =
    useProject();

  const [isLeftSidebarMinimized, setIsLeftSidebarMinimized] = useState(false);
  const [project, setProject] = useState<ProjectsDetailData | null>(null);
  const [isRoomCreating, setIsRoomCreating] = useState(false);

  // プロジェクトデータから必要な情報を取得
  const instancePrototypes: Prototype[] =
    project?.prototypes?.filter(({ type }) => type === 'INSTANCE') || [];
  const masterPrototype: Prototype | undefined = project?.prototypes?.find(
    ({ type }) => type === 'MASTER'
  );

  /**
   * 戻るボタンの処理
   * モードに応じて適切なページに遷移する
   */
  const handleBack = () => {
    // 作成モードの場合はプロジェクト一覧に戻る
    if (gameBoardMode === GameBoardMode.CREATE) {
      router.push('/projects');
      return;
    }
    // プレビューまたはプレイモードの場合はマスタープロトタイプに戻る
    if (
      gameBoardMode === GameBoardMode.PLAY ||
      gameBoardMode === GameBoardMode.PREVIEW
    ) {
      masterPrototype &&
        router.push(`/projects/${projectId}/prototypes/${masterPrototype.id}`);
      return;
    }
  };

  /**
   * プロトタイプを取得する
   */
  const getPrototypes = useCallback(async () => {
    try {
      const projectData = await getProject(projectId);
      setProject(projectData);
    } catch (error) {
      console.error('Error fetching prototypes:', error);
    }
  }, [getProject, projectId]);

  // プロトタイプを取得する
  useEffect(() => {
    getPrototypes();
  }, [getPrototypes]);

  // ルーム作成（バージョン＋インスタンス）
  const handleCreateRoom = async () => {
    if (isRoomCreating) return;
    setIsRoomCreating(true);
    try {
      // バージョン作成
      const now = new Date();
      const name = `${formatDate(now, true)}版`;
      const { version, instance } = await createPrototypeVersion(projectId, {
        name,
      });
      if (!version || !instance) {
        console.error('Version or instance creation failed');
        return;
      }
      await getPrototypes();
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setIsRoomCreating(false);
    }
  };

  // ルーム削除
  const handleDeleteRoom = async (instanceId: string) => {
    if (!window.confirm('本当にこのルームを削除しますか？')) return;

    try {
      // インスタンスから対応するバージョンを見つける
      const instance = instancePrototypes.find((i) => i.id === instanceId);
      if (!instance) {
        console.error('Instance not found');
        return;
      }

      // インスタンスに紐づくバージョンIDを取得
      const versionId = instance.sourceVersionPrototypeId;
      if (!versionId) {
        console.error('Version ID not found for instance');
        return;
      }

      // バージョン削除API（バージョンIDを指定してバージョンとインスタンスを一緒に削除）
      await deletePrototypeVersion(projectId, versionId);
      await getPrototypes();
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  const toggleSidebar = () => {
    setIsLeftSidebarMinimized(!isLeftSidebarMinimized);
  };

  // サイドバーのルームリスト部分のみを表示する
  const renderSidebarContent = () => {
    return (
      <div className="p-2 overflow-y-auto scrollbar-hide space-y-4">
        <div className="flex flex-col gap-2 py-0.5 px-0">
          {/* 新しいルーム作成ボタン */}
          <button
            onClick={handleCreateRoom}
            disabled={isRoomCreating}
            className="relative flex items-center bg-gradient-to-br from-kibako-tertiary to-kibako-white rounded-xl px-3 py-3 shadow-md min-w-[120px] text-left transition-all gap-2 border-2 border-dashed border-kibako-secondary hover:border-kibako-accent hover:border-solid mb-2 disabled:opacity-60 disabled:cursor-not-allowed"
            title="新しいルームを作る"
          >
            <MdMeetingRoom className="h-7 w-7 text-kibako-accent flex-shrink-0 mr-1" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-kibako-primary truncate block max-w-[180px]">
                新しいルームを作る
              </span>
              <span className="text-xs text-kibako-secondary mt-0.5 flex items-center gap-1">
                今のボードの状態を保存して
                <br />
                遊び場を作成します
              </span>
            </div>
            <IoAdd className="h-5 w-5 text-kibako-secondary ml-1 transition-colors" />
          </button>
          {instancePrototypes
            .slice()
            .sort((a, b) =>
              b.createdAt && a.createdAt
                ? new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
                : 0
            )
            .map((instance) => (
              <div key={instance.id} className="relative flex-shrink-0">
                <Link
                  href={`/projects/${projectId}/prototypes/${instance.id}`}
                  className="group"
                  title={`${instance.name + '版'}のルームを開く`}
                >
                  <div className="flex items-center bg-gradient-to-br from-kibako-tertiary to-kibako-white rounded-xl px-3 py-3 shadow-md min-w-[120px] text-left transition-all gap-2 group-hover:bg-kibako-accent/10 group-hover:border-kibako-accent border border-transparent">
                    <MdMeetingRoom className="h-7 w-7 text-kibako-accent flex-shrink-0 mr-1" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-semibold text-kibako-primary truncate block max-w-[180px]">
                        {instance.name}
                      </span>
                      <span className="text-xs text-kibako-secondary mt-0.5 flex items-center gap-1">
                        <span className="font-bold">入室する</span>
                      </span>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => handleDeleteRoom(instance.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full group/delete hover:bg-kibako-accent/20 focus:outline-none flex items-center justify-center"
                  title="ルームを削除"
                >
                  <MdDelete className="h-5 w-5 text-kibako-secondary transition-colors" />
                </button>
              </div>
            ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`fixed left-4 top-4 flex flex-col rounded-xl border border-wood-lightest/40 bg-gradient-to-r from-content to-content-secondary shadow-md w-[18rem] ${
        !isLeftSidebarMinimized ? 'overflow-auto max-h-[90vh]' : 'h-[48px]'
      }`}
    >
      <div className="flex h-[48px] items-center justify-between p-2">
        <button
          onClick={handleBack}
          className="p-1 hover:bg-wood-lightest/20 rounded-full transition-colors flex-shrink-0"
          title="戻る"
        >
          <IoArrowBack className="h-5 w-5 text-wood-dark hover:text-header transition-colors" />
        </button>
        <div className="flex items-center gap-1 flex-grow ml-1 min-w-0">
          <h2
            className="text-xs font-medium truncate text-wood-darkest"
            title={prototypeName}
          >
            {prototypeName}
          </h2>
        </div>
        {/* ルームを開いている時は開閉ボタンを非表示 */}
        {gameBoardMode !== GameBoardMode.PLAY && (
          <button
            onClick={toggleSidebar}
            aria-label={
              isLeftSidebarMinimized ? 'サイドバーを展開' : 'サイドバーを最小化'
            }
            className="p-1 rounded-full transition-transform hover:scale-110"
          >
            <IoMenu className="h-5 w-5 text-wood-dark hover:text-header transition-colors" />
          </button>
        )}
      </div>
      {/* サイドバーの中身はルームを開いている時は非表示 */}
      {!isLeftSidebarMinimized &&
        gameBoardMode !== GameBoardMode.PLAY &&
        renderSidebarContent()}
      <GameBoardInstructionPanel />
    </div>
  );
}
