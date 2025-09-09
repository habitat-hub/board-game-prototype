'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FaPlus, FaTable, FaTh } from 'react-icons/fa';
import { IoReload } from 'react-icons/io5';
import { RiLoaderLine } from 'react-icons/ri';

import { useProject } from '@/api/hooks/useProject';
import { usePrototypes } from '@/api/hooks/usePrototypes';
import { Prototype, Project } from '@/api/types';
import KibakoButton from '@/components/atoms/KibakoButton';
import KibakoToggle from '@/components/atoms/KibakoToggle';
import Loading from '@/components/organisms/Loading';
import { ProjectContextMenu } from '@/features/prototype/components/atoms/ProjectContextMenu';
import { EmptyProjectState } from '@/features/prototype/components/molecules/EmptyProjectState';
import { ProjectCardList } from '@/features/prototype/components/molecules/ProjectCardList';
import { ProjectTable } from '@/features/prototype/components/molecules/ProjectTable';
import useInlineEdit from '@/hooks/useInlineEdit';
import { useUser } from '@/hooks/useUser';
import { deleteExpiredImagesFromIndexedDb } from '@/utils/db';
import {
  getUIPreference,
  setUIPreference,
  ProjectListView,
} from '@/utils/uiPreferences';

// 役割名の定数（マジックストリング回避）
const ROLE_ADMIN = 'admin' as const;

/**
 * ProjectListコンポーネントで使用される各種Stateの説明:
 *
 * @state isCreating - プロジェクト作成中のローディング状態を管理するState。
 * @state prototypeList - プロジェクトのリストを保持するState。
 *
 * データ取得はuseQueryで管理され、タブ切り替え時の自動再取得に対応しています。
 * 編集機能はuseInlineEditカスタムフックで管理されています。
 */
const ProjectList: React.FC = () => {
  const router = useRouter();
  const { useUpdatePrototype } = usePrototypes();
  const { useGetProjects, createProject, getProjectRoles, duplicateProject } =
    useProject();
  const { user } = useUser();

  // useQueryとuseMutationフックの使用
  const {
    data: projectsData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useGetProjects();
  const updatePrototypeMutation = useUpdatePrototype();
  // インライン編集フック
  const {
    editingId: nameEditingId,
    editedValue: editedName,
    setEditedValue: setEditedName,
    isEditing,
    handleKeyDown,
    handleSubmit,
    handleBlur,
  } = useInlineEdit();

  // プロトタイプ作成中フラグ
  const [isCreating, setIsCreating] = useState<boolean>(false);
  // リロードアイコンのワンショットアニメーション制御
  const [isReloadAnimating, setIsReloadAnimating] = useState<boolean>(false);

  // プロジェクトごとの管理者権限マップ
  const [projectAdminMap, setProjectAdminMap] = useState<
    Record<string, boolean>
  >({});

  // 表示モードとソート設定（永続値を安全に復元）
  const [viewMode, setViewMode] = useState<ProjectListView>(() => {
    const v = getUIPreference('projectListView');
    return v === 'card' || v === 'table' ? v : 'card';
  });
  const [sortKey, setSortKey] = useState<'name' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: 'name' | 'createdAt') => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // データ変換処理
  const prototypeList = useMemo(
    () =>
      projectsData?.map(({ project, prototypes }) => ({
        project,
        masterPrototype: prototypes.find(({ type }) => type === 'MASTER'),
      })) || [],
    [projectsData]
  );

  const sortedPrototypeList = useMemo(
    () =>
      prototypeList
        .filter(
          (item): item is { project: Project; masterPrototype: Prototype } =>
            !!item.masterPrototype
        )
        .sort((a, b) => {
          if (sortKey === 'name') {
            const nameA = a.masterPrototype.name ?? '';
            const nameB = b.masterPrototype.name ?? '';
            return sortOrder === 'asc'
              ? nameA.localeCompare(nameB, 'ja')
              : nameB.localeCompare(nameA, 'ja');
          } else {
            const tA = a.masterPrototype.createdAt
              ? new Date(a.masterPrototype.createdAt).getTime()
              : 0;
            const tB = b.masterPrototype.createdAt
              ? new Date(b.masterPrototype.createdAt).getTime()
              : 0;
            return sortOrder === 'asc' ? tA - tB : tB - tA;
          }
        }),
    [prototypeList, sortKey, sortOrder]
  );

  // ユーザーが管理者かどうかを取得
  useEffect(() => {
    // projectsData または user が未定義の場合は全て非管理者として扱う
    if (!projectsData || !user) {
      setProjectAdminMap({});
      return;
    }

    const cancelled = { current: false } as const as { current: boolean };
    const fetchRoles = async (): Promise<void> => {
      const entries = await Promise.all(
        projectsData.map(async ({ project }) => {
          try {
            const roles = await getProjectRoles(project.id);
            const isAdmin = roles.some(
              (r) =>
                r.userId === user.id &&
                r.roles.some((role) => role.name === ROLE_ADMIN)
            );
            return [project.id, isAdmin] as const;
          } catch (e) {
            // 予期しないエラーはログに記録し、UI 側は非管理者として扱う
            console.error('プロジェクトのロール取得に失敗しました:', {
              projectId: project.id,
              error: e,
            });
            return [project.id, false] as const;
          }
        })
      );
      if (!cancelled.current) {
        setProjectAdminMap(Object.fromEntries(entries));
      }
    };
    fetchRoles();
    return () => {
      cancelled.current = true;
    };
  }, [projectsData, user, getProjectRoles]);

  // コンテキストメニューの状態
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    position: { x: number; y: number };
    targetProject: { project: Project; masterPrototype: Prototype } | null;
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    targetProject: null,
  });

  // 1日に1回、IndexedDBから期限切れの画像を削除する
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
    const lastRun = localStorage.getItem('deleteExpiredImagesLastRun');

    if (lastRun !== today) {
      deleteExpiredImagesFromIndexedDb();
      localStorage.setItem('deleteExpiredImagesLastRun', today);
    }
  }, []);

  /**
   * ランダムなプロトタイプ名を生成する
   * @returns ランダムなプロトタイプ名
   */
  const generateRandomPrototypeName = (): string => {
    const adjectives = [
      'エキサイティング',
      'クリエイティブ',
      'ファンタスティック',
      'イノベーティブ',
      'ダイナミック',
      'ユニーク',
      'アメージング',
      'インスパイアリング',
      'マジカル',
      'レボリューショナリー',
    ];

    const nouns = [
      'ゲーム',
      'アドベンチャー',
      'クエスト',
      'チャレンジ',
      'ジャーニー',
      'ミッション',
      'エクスペリエンス',
      'ストーリー',
      'ワールド',
      'バトル',
    ];

    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

    return `${randomAdjective}${randomNoun}`;
  };

  /**
   * 新しいプロトタイプを作成する
   */
  const handleCreatePrototype = async () => {
    try {
      setIsCreating(true);

      // ランダムな名前でプロトタイプを作成
      const randomName = generateRandomPrototypeName();
      const project = await createProject({
        name: randomName,
      });

      const masterPrototype = project.prototypes.find(
        (p) => p.type === 'MASTER'
      );

      if (!masterPrototype) {
        throw new Error('Cannot find a prototype with type "MASTER".');
      }

      // 編集ページへ遷移（成功時はページ遷移するのでsetIsCreating(false)は不要）
      router.push(
        `/projects/${project.project.id}/prototypes/${masterPrototype.id}`
      );
    } catch (error) {
      console.error('Error creating prototype:', error);
      alert('プロトタイプの作成中にエラーが発生しました。');
      // エラーが発生した場合のみローディング状態を解除
      setIsCreating(false);
    }
  };

  /**
   * プロトタイプ名の編集を完了する処理
   * masterプロトタイプの名前をAPIで更新する
   */
  const handleNameEditComplete = async (newName: string) => {
    // 変更がない場合は何もしない
    const currentPrototype = prototypeList.find(
      ({ masterPrototype }) => masterPrototype?.id === nameEditingId
    );
    if (currentPrototype?.masterPrototype?.name === newName.trim()) {
      return;
    }

    try {
      const prototype = prototypeList.find(
        ({ masterPrototype }) => masterPrototype?.id === nameEditingId
      );
      if (!prototype) return;

      /**
       * masterプロトタイプの名前をAPIで更新
       * NOTE: ユーザーに見せるプロジェクト名はプロトタイプで管理している。
       * プロトタイプ名を更新した際にはユーザーに見せるプロジェクト名も更新する必要があるためプロジェクトのキャッシュを削除する
       */
      await updatePrototypeMutation.mutateAsync({
        prototypeId: nameEditingId,
        data: {
          name: newName.trim(),
        },
      });
    } catch (error) {
      console.error('Error updating prototype name:', error);
      throw new Error('プロトタイプ名の更新中にエラーが発生しました。');
    }
  };

  // プロトタイプ名のバリデーション関数
  const validatePrototypeName = (value: string): string | null => {
    if (!value.trim()) {
      return 'プロトタイプ名を入力してください';
    }
    return null;
  };

  /**
   * 右クリック時の処理
   */
  const handleContextMenu = (
    e: React.MouseEvent,
    project: Project,
    masterPrototype: Prototype
  ) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      position: { x: e.clientX, y: e.clientY },
      targetProject: { project, masterPrototype },
    });
  };

  /**
   * コンテキストメニューを閉じる
   */
  const closeContextMenu = () => {
    setContextMenu({
      visible: false,
      position: { x: 0, y: 0 },
      targetProject: null,
    });
  };

  /**
   * コンテキストメニューのアイテム定義
   */
  const getContextMenuItems = (
    project: Project,
    _masterPrototype: Prototype
  ) => {
    const items = [
      {
        id: 'duplicate',
        text: '複製',
        action: async () => {
          try {
            const result = await duplicateProject(project.id);
            const master = result.prototypes.find((p) => p.type === 'MASTER');
            if (master) {
              router.push(
                `/projects/${result.project.id}/prototypes/${master.id}`
              );
            }
          } catch (error) {
            console.error('Failed to duplicate project', error);
            alert('プロジェクトの複製に失敗しました。');
          }
        },
      },
      {
        id: 'permissions',
        text: '権限設定',
        action: () => {
          router.push(`/projects/${project.id}/roles`);
        },
      },
    ];
    if (projectAdminMap[project.id]) {
      items.push({
        id: 'delete',
        text: '削除',
        action: () => {
          router.push(`/projects/${project.id}/delete`);
        },
      });
    }
    return items;
  };

  // ローディング表示
  if (isLoading) {
    return <Loading />;
  }

  // 空状態表示
  if (prototypeList.length === 0 || error) {
    return (
      <EmptyProjectState
        isCreating={isCreating}
        onCreatePrototype={handleCreatePrototype}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-8 relative px-4">
      {/* 1行目: タイトルと新規作成を横並び、2行目: 右端にトグル */}
      <div className="sticky top-20 z-sticky bg-transparent backdrop-blur-sm flex flex-col gap-8 pt-16 pb-4 rounded-lg">
        {/* 1行目 */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* 左側: タイトル + リロード */}
          <div className="flex items-center gap-3">
            <h1 className="text-3xl text-kibako-primary font-bold mb-0">
              プロジェクト一覧
            </h1>
            <KibakoButton
              onClick={() => {
                setIsReloadAnimating(true);
                if (refetch) refetch();
              }}
              disabled={!!isFetching}
              aria-label="プロジェクト一覧を最新化"
              title="プロジェクト一覧を最新化"
              className={`w-10 h-10 p-0 z-dropdown ${isFetching ? '' : ''}`}
            >
              <IoReload
                className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`}
                style={
                  !isFetching && isReloadAnimating
                    ? {
                        animation: 'spin 1.2s linear 1',
                        display: 'inline-block',
                      }
                    : { display: 'inline-block' }
                }
                onAnimationEnd={() => {
                  if (!isFetching) setIsReloadAnimating(false);
                }}
              />
            </KibakoButton>
          </div>

          {/* 右側: 新規作成 */}
          <div className="flex items-center">
            <KibakoButton
              onClick={handleCreatePrototype}
              disabled={isCreating}
              className="gap-2 h-12 px-4 shadow-lg hover:shadow-xl z-dropdown"
              title={isCreating ? '作成中...' : '新しいプロジェクトを作成'}
            >
              {isCreating ? (
                <>
                  <RiLoaderLine className="w-5 h-5 animate-spin" />
                  <span className="text-sm">作成中...</span>
                </>
              ) : (
                <>
                  <FaPlus className="w-5 h-5" />
                  <span className="text-sm">新規作成</span>
                </>
              )}
            </KibakoButton>
          </div>
        </div>

        {/* 2行目 */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-kibako-primary/30 bg-gradient-to-r from-kibako-primary/10 to-kibako-secondary/10 text-kibako-primary px-3 py-1 text-sm shadow-sm">
            <span className="font-medium">プロジェクト数</span>
            <span
              className="inline-flex items-center rounded-full bg-white/60 text-kibako-primary px-2 py-0.5 text-xs font-semibold shadow-xs"
              aria-label="プロジェクト数"
            >
              {sortedPrototypeList.length}
            </span>
          </div>
          <KibakoToggle
            checked={viewMode === 'table'}
            onChange={(checked) => {
              const mode = checked ? 'table' : 'card';
              setViewMode(mode);
              setUIPreference('projectListView', mode);
            }}
            labelLeft={<FaTh className="w-4 h-4" aria-hidden="true" />}
            labelRight={<FaTable className="w-4 h-4" aria-hidden="true" />}
            shouldChangeBackgroud={false}
            ariaLabel={
              viewMode === 'card' ? 'テーブル表示に切替' : 'カード表示に切替'
            }
          />
        </div>
      </div>

      {viewMode === 'card' ? (
        <ProjectCardList
          prototypeList={prototypeList.filter(
            (item): item is { project: Project; masterPrototype: Prototype } =>
              !!item.masterPrototype
          )}
          projectAdminMap={projectAdminMap}
          isNameEditing={(prototypeId) => isEditing(prototypeId)}
          editedName={editedName}
          setEditedName={setEditedName}
          onCardClick={(projectId, prototypeId) =>
            router.push(`/projects/${projectId}/prototypes/${prototypeId}`)
          }
          onContextMenu={handleContextMenu}
          onSubmit={(e) =>
            handleSubmit(e, handleNameEditComplete, validatePrototypeName)
          }
          onBlur={() =>
            handleBlur(handleNameEditComplete, validatePrototypeName)
          }
          onKeyDown={(e) =>
            handleKeyDown(e, handleNameEditComplete, validatePrototypeName)
          }
        />
      ) : (
        <ProjectTable
          prototypeList={sortedPrototypeList}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={handleSort}
          onSelectPrototype={(projectId, prototypeId) =>
            router.push(`/projects/${projectId}/prototypes/${prototypeId}`)
          }
          projectAdminMap={projectAdminMap}
        />
      )}

      {/* コンテキストメニュー */}
      {contextMenu.targetProject &&
        createPortal(
          <ProjectContextMenu
            visible={contextMenu.visible}
            position={contextMenu.position}
            width={140}
            itemHeight={32}
            items={getContextMenuItems(
              contextMenu.targetProject.project,
              contextMenu.targetProject.masterPrototype
            )}
            onClose={closeContextMenu}
          />,
          document.body
        )}
    </div>
  );
};

export default ProjectList;
