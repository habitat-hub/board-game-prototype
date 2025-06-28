/**
 * @page サイドバーコンポーネント（プレビューモードとパーツ作成モードを兼ねている）
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { BsBoxSeam } from 'react-icons/bs';
import { IoArrowBack, IoMenu, IoAdd, IoEye } from 'react-icons/io5';
import { MdMeetingRoom, MdDelete } from 'react-icons/md';

import { useProject } from '@/api/hooks/useProject';
import { usePrototypes } from '@/api/hooks/usePrototypes';
import { Prototype, Project } from '@/api/types';
import { GameBoardMode } from '@/features/prototype/types/gameBoardMode';
import formatDate from '@/utils/dateFormat';

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
  const { getProject, createPrototypeVersion } = useProject();
  const { deletePrototype } = usePrototypes();

  const [isLeftSidebarMinimized, setIsLeftSidebarMinimized] = useState(false);
  const [prototypeInfo, setPrototypeInfo] = useState<{
    project: Project | null;
    master: Prototype | null;
    versions: Prototype[];
    instances: Prototype[];
    instancesByVersion: Record<string, Prototype[]>;
  } | null>(null);
  const [isRoomCreating, setIsRoomCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<GameBoardMode>(
    gameBoardMode === GameBoardMode.PLAY
      ? GameBoardMode.PLAY
      : GameBoardMode.CREATE
  );

  /**
   * プロトタイプを取得する
   */
  const getPrototypes = useCallback(async () => {
    try {
      const { project, prototypes } = await getProject(projectId);

      // マスター版プロトタイプ
      const master = prototypes.find(({ type }) => type === 'MASTER');
      // バージョン版プロトタイプ
      const versions = prototypes.filter(({ type }) => type === 'VERSION');
      // インスタンス版プロトタイプ
      const instances = prototypes.filter(({ type }) => type === 'INSTANCE');

      // バージョンごとにインスタンスをまとめる
      const instancesByVersion: Record<string, Prototype[]> = {};
      versions.forEach((version) => {
        instancesByVersion[version.id] = instances.filter((_instance) => {
          // インスタンスがどのバージョンから作られたかを判定
          return _instance.sourceVersionPrototypeId === version.id;
        });
      });

      setPrototypeInfo({
        project: project || null,
        master: master || null,
        versions,
        instances,
        instancesByVersion,
      });
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
      await createPrototypeVersion(projectId, {
        name: 'ルーム',
        versionNumber: (prototypeInfo?.versions?.length || 0) + 1,
      });
      // 今はバージョンのプレイ画面に遷移 → プロジェクトID・プロトタイプIDで遷移
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
    await deletePrototype(instanceId);
    await getPrototypes();
  };

  const toggleSidebar = () => {
    setIsLeftSidebarMinimized(!isLeftSidebarMinimized);
  };

  const renderTypeBadge = () => {
    switch (gameBoardMode) {
      case GameBoardMode.CREATE:
        return (
          <span className="ml-2 flex items-center">
            <BsBoxSeam className="text-kibako-primary h-4 w-4" />
          </span>
        );
      case GameBoardMode.PREVIEW:
        return (
          <span className="ml-2 flex items-center">
            <IoEye className="text-kibako-primary h-4 w-4" />
          </span>
        );
      case GameBoardMode.PLAY:
        return (
          <span className="ml-2 flex items-center">
            <MdMeetingRoom className="text-kibako-primary h-4 w-4" />
          </span>
        );
      default:
        return null;
    }
  };

  // 新デザイン: トグルで「作る」「遊ぶ」切り替え
  const renderSidebarContent = () => {
    if (!prototypeInfo) return null;
    return (
      <div className="p-2 overflow-y-auto scrollbar-hide space-y-4">
        {/* アイコンメインのトグルボタン */}
        <div className="flex gap-1 mb-2">
          <button
            className={`flex-1 flex flex-col items-center py-1.5 rounded-lg font-bold border transition-all ${
              activeTab === GameBoardMode.CREATE
                ? 'bg-kibako-tertiary text-kibako-primary border-kibako-secondary'
                : 'bg-kibako-white text-kibako-secondary border-kibako-tertiary hover:bg-kibako-tertiary'
            }`}
            onClick={() => setActiveTab(GameBoardMode.CREATE)}
          >
            <BsBoxSeam
              className={`h-6 w-6 mb-0.5 ${activeTab === GameBoardMode.CREATE ? 'text-kibako-primary' : 'text-kibako-secondary'}`}
            />
            <span className="text-[10px] font-normal tracking-widest">
              作る
            </span>
          </button>
          <button
            className={`flex-1 flex flex-col items-center py-1.5 rounded-lg font-bold border transition-all ${
              activeTab === GameBoardMode.PLAY
                ? 'bg-kibako-tertiary text-kibako-primary border-kibako-secondary'
                : 'bg-kibako-white text-kibako-secondary border-kibako-tertiary hover:bg-kibako-tertiary'
            }`}
            onClick={() => setActiveTab(GameBoardMode.PLAY)}
          >
            <MdMeetingRoom
              className={`h-6 w-6 mb-0.5 ${activeTab === GameBoardMode.PLAY ? 'text-kibako-primary' : 'text-kibako-secondary'}`}
            />
            <span className="text-[10px] font-normal tracking-widest">
              遊ぶ
            </span>
          </button>
        </div>
        {/* 作るタブは空 */}
        {activeTab === GameBoardMode.CREATE && <div />}
        {/* 遊ぶタブ */}
        {activeTab === GameBoardMode.PLAY && (
          <div>
            <div className="flex flex-col gap-2 py-0.5 px-0">
              <button
                onClick={handleCreateRoom}
                disabled={isRoomCreating}
                className="flex items-center justify-center border-2 border-dashed border-kibako-tertiary hover:border-kibako-secondary rounded-xl px-2 py-2 min-w-[70px] text-center shadow-none transition-all hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0 bg-kibako-tertiary gap-2 mb-2"
                style={{ height: '56px' }}
                title="新しいルームを作る"
              >
                <MdMeetingRoom className="h-6 w-6 text-kibako-secondary transition-colors" />
                <div className="flex flex-col items-start text-left">
                  <span className="text-xs font-semibold text-kibako-secondary block">
                    新規ルーム
                  </span>
                  <span className="text-[10px] text-kibako-secondary/70 mt-0.5 leading-tight">
                    今のボードの状態を保存して
                    <br />
                    ルームを作成します
                  </span>
                </div>
                <IoAdd className="h-4 w-4 text-kibako-secondary ml-1 transition-colors" />
              </button>
              {prototypeInfo.instances
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
                      title={`${instance.name} (Room ${instance.versionNumber})`}
                    >
                      <div className="flex items-center bg-gradient-to-br from-kibako-tertiary to-kibako-white rounded-xl px-3 py-3 shadow-md min-w-[120px] text-left transition-all gap-2 group-hover:bg-kibako-accent/10 group-hover:border-kibako-accent border border-transparent">
                        <MdMeetingRoom className="h-7 w-7 text-kibako-accent flex-shrink-0 mr-1" />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm font-semibold text-kibako-primary truncate block max-w-[120px]">
                            {instance.name}
                          </span>
                          <span className="text-xs text-kibako-primary mt-0.5 flex items-center gap-1">
                            <span className="font-bold">
                              Ver{instance.versionNumber}
                            </span>
                            {instance.createdAt && (
                              <span className="text-kibako-secondary">
                                {formatDate(instance.createdAt, true)}
                              </span>
                            )}
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
        )}
      </div>
    );
  };

  // タブ切り替え時の遷移処理
  useEffect(() => {
    if (activeTab === 'create' && prototypeInfo?.master?.id) {
      router.push(
        `/projects/${projectId}/prototypes/${prototypeInfo.master.id}`
      );
    }
  }, [activeTab, prototypeInfo?.master?.id, projectId, router]);

  // gameBoardModeが変わったときもactiveTabを同期
  useEffect(() => {
    setActiveTab(
      gameBoardMode === GameBoardMode.PLAY
        ? GameBoardMode.PLAY
        : GameBoardMode.CREATE
    );
  }, [gameBoardMode]);

  return (
    <div
      className={`fixed left-4 top-4 flex flex-col rounded-xl border border-wood-lightest/40 bg-gradient-to-r from-content to-content-secondary shadow-md w-[18rem] ${
        !isLeftSidebarMinimized ? 'overflow-auto max-h-[90vh]' : 'h-[48px]'
      }`}
    >
      <div className="flex h-[48px] items-center justify-between p-2">
        <button
          onClick={() => router.back()}
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
          {renderTypeBadge()}
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
    </div>
  );
}
