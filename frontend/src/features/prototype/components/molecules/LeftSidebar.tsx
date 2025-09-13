'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { IoArrowBack, IoMenu, IoAdd } from 'react-icons/io5';
import { MdMeetingRoom, MdDelete } from 'react-icons/md';
import { twMerge } from 'tailwind-merge';

import { useProject } from '@/api/hooks/useProject';
import { useUsers } from '@/api/hooks/useUsers';
import { Prototype, ProjectsDetailData } from '@/api/types';
import KibakoButton from '@/components/atoms/KibakoButton';
import { PERMISSION_ACTIONS, RoleType } from '@/constants/roles';
import ConnectedUserIcon from '@/features/prototype/components/atoms/ConnectedUserIcon';
import PrototypeNameEditor from '@/features/prototype/components/atoms/PrototypeNameEditor';
import GameBoardHelpPanel from '@/features/prototype/components/molecules/GameBoardHelpPanel';
import { MAX_DISPLAY_USERS } from '@/features/prototype/constants';
import { useProjectSocket } from '@/features/prototype/hooks/useProjectSocket';
import { GameBoardMode } from '@/features/prototype/types';
import { useUser } from '@/hooks/useUser';
import formatDate from '@/utils/dateFormat';
import { can } from '@/utils/permissions';

type LeftSidebarProps = {
  /** プロトタイプ名（表示用） */
  prototypeName: string;
  /** プロトタイプID（編集やソケット同期に使用） */
  prototypeId: string;
  /** ゲームボードの現在モード */
  gameBoardMode: GameBoardMode;
  /** プロジェクトID（APIリクエスト等で使用） */
  projectId: string;
  /** プロトタイプ名変更を親コンポーネントへ通知するコールバック */
  onPrototypeNameChange: (name: string) => void;
};

export default function LeftSidebar({
  prototypeName,
  prototypeId,
  gameBoardMode,
  projectId,
  onPrototypeNameChange,
}: LeftSidebarProps) {
  const router = useRouter();
  const { user } = useUser();
  const { checkNeedTutorial } = useUsers();
  const {
    getProject,
    createPrototypeVersion,
    deletePrototypeVersion,
    getProjectRoles,
  } = useProject();

  // プロジェクトレベルのSocket通信設定（state 初期化前に宣言し、project 依存を排除）
  const {
    prototypes: socketPrototypes,
    roomConnectedUsers,
    updatePrototypes,
  } = useProjectSocket({
    projectId,
    userId: user?.id,
  });

  const [isLeftSidebarMinimized, setIsLeftSidebarMinimized] = useState(false);
  const [project, setProject] = useState<ProjectsDetailData | null>(null);
  const [isRoomCreating, setIsRoomCreating] = useState(false);
  const [needTutorial, setNeedTutorial] = useState(false);
  const [currentRole, setCurrentRole] = useState<RoleType | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null
  );

  // プロジェクトデータから必要な情報を取得
  // Socket通信で更新されたプロトタイプがあればそれを優先、なければプロジェクトのプロトタイプを使用
  const prototypes: Prototype[] =
    socketPrototypes.length > 0
      ? socketPrototypes
      : (project?.prototypes ?? []);
  const instancePrototypes: Prototype[] = prototypes.filter(
    ({ type }) => type === 'INSTANCE'
  );
  const masterPrototype: Prototype | undefined = prototypes.find(
    ({ type }) => type === 'MASTER'
  );
  const currentPrototype: Prototype | undefined = prototypes.find(
    ({ id }) => id === prototypeId
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
    // プレビューまたはプレイルームの場合はマスタープロトタイプに戻る
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
      // Socket通信のプロトタイプ状態も更新
      updatePrototypes(projectData.prototypes || []);
    } catch (error) {
      console.error('プロトタイプの取得中にエラーが発生しました：', error);
    }
  }, [getProject, projectId, updatePrototypes]);

  // プロトタイプを取得する
  useEffect(() => {
    getPrototypes();
  }, [getPrototypes]);

  // チュートリアル表示が必要かどうかを確認
  useEffect(() => {
    const fetchNeedTutorialStatus = async () => {
      if (!user?.id) return;
      try {
        const result = await checkNeedTutorial(user.id);
        setNeedTutorial(result.needTutorial);
      } catch (error) {
        console.error(
          'チュートリアル判定API呼び出し中にエラーが発生しました：',
          error
        );
      }
    };
    fetchNeedTutorialStatus();
  }, [user?.id, checkNeedTutorial]);

  // 現在のユーザーロールを取得
  useEffect(() => {
    const fetchRole = async () => {
      if (!user?.id) return;
      try {
        const roles = await getProjectRoles(projectId);
        const role =
          (roles.find((r) => r.userId === user.id)?.roles?.[0]
            ?.name as RoleType | null) ?? null;
        setCurrentRole(role);
      } catch (error) {
        console.error('ロールの取得中にエラーが発生しました：', error);
      }
    };
    fetchRole();
  }, [getProjectRoles, projectId, user?.id]);

  // プレイルーム作成（バージョン＋インスタンス）
  const handleCreateRoom = async () => {
    if (!can(currentRole, PERMISSION_ACTIONS.WRITE)) return;
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
    } catch (error) {
      console.error('Error creating playroom:', error);
    } finally {
      setIsRoomCreating(false);
    }
  };

  // プレイルーム削除
  const handleDeleteRoom = async (instanceId: string) => {
    if (!can(currentRole, PERMISSION_ACTIONS.DELETE)) return;

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
    } catch (error) {
      console.error('Error deleting playroom:', error);
    }
  };

  const toggleSidebar = () => {
    setIsLeftSidebarMinimized(!isLeftSidebarMinimized);
  };

  // プロトタイプ名の更新完了時の処理
  const handlePrototypeNameUpdated = (newName: string) => {
    // プロトタイプリストを更新
    updatePrototypes(
      prototypes.map((p) =>
        p.id === prototypeId ? { ...p, name: newName } : p
      )
    );
    // 親コンポーネントに通知
    onPrototypeNameChange(newName);
  };

  // サイドバーのプレイルームリスト部分のみを表示する
  const renderSidebarContent = () => {
    return (
      <div className="p-2 overflow-y-auto scrollbar-hide space-y-4">
        <div className="flex flex-col gap-2 py-0.5 px-0">
          {/* 新しいプレイルーム作成ボタン */}
          {can(currentRole, PERMISSION_ACTIONS.WRITE) && (
            <button
              onClick={handleCreateRoom}
              disabled={isRoomCreating}
              className="relative flex items-center justify-start bg-kibako-accent text-kibako-white rounded-xl h-12 px-4 shadow-lg min-w-[120px] text-left transition-all gap-2 hover:brightness-75 active:brightness-75 mb-2 disabled:opacity-60 disabled:cursor-not-allowed"
              title="今のゲームボードの状態を保存して、プレイルームを作る"
            >
              <MdMeetingRoom className="h-12 w-12 text-kibako-white flex-shrink-0 mr-1" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold text-kibako-white truncate block max-w-[180px]">
                  プレイルームを作る
                </span>
              </div>
              <IoAdd className="h-5 w-5 text-kibako-white ml-1 transition-colors" />
            </button>
          )}
          {instancePrototypes
            .slice()
            .sort((a, b) =>
              b.createdAt && a.createdAt
                ? new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
                : 0
            )
            .map((instance) => {
              const connectedUsers = roomConnectedUsers[instance.id] || [];
              const isConfirming = confirmingDeleteId === instance.id;
              const CardInner = (
                <div
                  className={
                    'bg-gradient-to-br from-kibako-tertiary to-kibako-white rounded-xl px-3 py-3 shadow-md min-w-[120px] text-left transition-all border ' +
                    (isConfirming
                      ? 'border-kibako-danger/40'
                      : 'group-hover:bg-kibako-accent/10 group-hover:border-kibako-accent border-transparent')
                  }
                >
                  {isConfirming ? (
                    <div className="flex items-start gap-3">
                      <MdDelete className="h-6 w-6 text-kibako-danger flex-shrink-0 mt-0.5" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-semibold text-kibako-primary whitespace-normal break-words">
                          「{instance.name}」を削除してもよろしいですか？
                        </span>
                        <div className="flex items-center gap-2 mt-3">
                          <KibakoButton
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setConfirmingDeleteId(null);
                            }}
                          >
                            キャンセル
                          </KibakoButton>
                          <KibakoButton
                            variant="danger"
                            size="sm"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              await handleDeleteRoom(instance.id);
                              setConfirmingDeleteId(null);
                            }}
                          >
                            削除する
                          </KibakoButton>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <MdMeetingRoom className="h-12 w-12 text-kibako-accent flex-shrink-0 mr-1" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-semibold text-kibako-primary truncate block max-w-[180px]">
                          {instance.name}
                        </span>
                        <div className="text-xs text-kibako-secondary mt-0.5">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="font-bold">入室する</span>
                          </div>
                          {connectedUsers.length > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs">接続中:</span>
                              <div className="flex -space-x-3">
                                {connectedUsers
                                  .slice(0, MAX_DISPLAY_USERS)
                                  .map((user, idx) => (
                                    <ConnectedUserIcon
                                      key={user.userId}
                                      user={user}
                                      users={connectedUsers}
                                      index={idx}
                                    />
                                  ))}
                                {connectedUsers.length > MAX_DISPLAY_USERS && (
                                  <span className="text-xs text-kibako-secondary ml-2">
                                    +{connectedUsers.length - MAX_DISPLAY_USERS}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );

              return (
                <div key={instance.id} className="relative flex-shrink-0">
                  {isConfirming ? (
                    <div className="group">{CardInner}</div>
                  ) : (
                    <Link
                      href={`/projects/${projectId}/prototypes/${instance.id}`}
                      className="group"
                      title={`${instance.name}に入室する`}
                    >
                      {CardInner}
                    </Link>
                  )}

                  {can(currentRole, PERMISSION_ACTIONS.DELETE) &&
                    !isConfirming && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setConfirmingDeleteId(instance.id);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full group/delete hover:bg-kibako-accent/20 focus:outline-none flex items-center justify-center"
                        title="プレイルームを削除"
                      >
                        <MdDelete className="h-5 w-5 text-kibako-secondary transition-colors" />
                      </button>
                    )}
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  return (
    <div
      className={twMerge(
        'fixed left-4 top-4 flex flex-col rounded-xl border border-kibako-tertiary/40 bg-gradient-to-r from-kibako-white to-kibako-tertiary shadow-md w-[18rem]',
        isLeftSidebarMinimized ? 'h-[48px]' : 'overflow-auto max-h-[90vh]'
      )}
    >
      <div className="flex h-[48px] items-center justify-between p-2">
        <button
          onClick={handleBack}
          className="p-1 hover:bg-kibako-tertiary/20 rounded-full transition-colors flex-shrink-0"
          title="戻る"
        >
          <IoArrowBack className="h-5 w-5 text-kibako-primary hover:text-kibako-primary transition-colors" />
        </button>
        <div className="flex items-center gap-1 flex-grow ml-1 min-w-0">
          <PrototypeNameEditor
            prototypeId={prototypeId}
            name={prototypeName}
            onUpdated={handlePrototypeNameUpdated}
            editable={can(currentRole, PERMISSION_ACTIONS.MANAGE)}
            notEditableReason="Adminのみ名前を変更できます"
          />
        </div>
        {/* プレイルームを開いている時は開閉ボタンを非表示 */}
        {gameBoardMode !== GameBoardMode.PLAY && (
          <button
            onClick={toggleSidebar}
            aria-label={
              isLeftSidebarMinimized ? 'サイドバーを展開' : 'サイドバーを最小化'
            }
            className="p-1 rounded-full transition-transform hover:scale-110"
          >
            <IoMenu className="h-5 w-5 text-kibako-primary hover:text-kibako-primary transition-colors" />
          </button>
        )}
      </div>
      {/* サイドバーの中身はプレイルームを開いている時は非表示 */}
      {!isLeftSidebarMinimized &&
        gameBoardMode !== GameBoardMode.PLAY &&
        renderSidebarContent()}
      <GameBoardHelpPanel
        defaultExpanded={
          needTutorial &&
          gameBoardMode === GameBoardMode.CREATE &&
          currentPrototype?.type === 'MASTER'
        }
      />
    </div>
  );
}
