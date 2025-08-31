'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaPlus } from 'react-icons/fa';
import { IoReload } from 'react-icons/io5';
import { RiLoaderLine } from 'react-icons/ri';

import { useProject } from '@/api/hooks/useProject';
import { usePrototypes } from '@/api/hooks/usePrototypes';
import { Prototype, Project } from '@/api/types';
import Loading from '@/components/organisms/Loading';
import { ProjectContextMenu } from '@/features/prototype/components/atoms/ProjectContextMenu';
import { EmptyProjectState } from '@/features/prototype/components/molecules/EmptyProjectState';
import { ProjectCard } from '@/features/prototype/components/molecules/ProjectCard';
import useInlineEdit from '@/hooks/useInlineEdit';
import { deleteExpiredImagesFromIndexedDb } from '@/utils/db';

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
  const { useGetProjects, createProject } = useProject();

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
    startEditing: handleNameEditToggle,
    handleKeyDown,
    handleSubmit,
    handleBlur,
  } = useInlineEdit();

  // プロトタイプ作成中フラグ
  const [isCreating, setIsCreating] = useState<boolean>(false);
  // リロードアイコンのワンショットアニメーション制御
  const [isReloadAnimating, setIsReloadAnimating] = useState<boolean>(false);

  // データ変換処理
  const prototypeList =
    projectsData?.map(({ project, prototypes }) => ({
      project,
      masterPrototype: prototypes.find(({ type }) => type === 'MASTER'),
    })) || [];

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
    masterPrototype: Prototype
  ) => [
    {
      id: 'rename',
      text: '名前変更',
      action: () => {
        handleNameEditToggle(masterPrototype.id, masterPrototype.name);
      },
    },
    {
      id: 'permissions',
      text: '権限設定',
      action: () => {
        router.push(`/projects/${project.id}/roles`);
      },
    },
    {
      id: 'delete',
      text: '削除',
      action: () => {
        router.push(`/projects/${project.id}/delete`);
      },
    },
  ];

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
    <div className="max-w-6xl mx-auto py-16 relative px-4">
      {/* タイトルと作成ボタンを同じ行に表示（小さい画面では縦並び） */}
      <div className="sticky top-20 z-30 bg-transparent backdrop-blur-sm flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4 py-4 rounded-lg">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl text-kibako-primary font-bold mb-0 bg-gradient-to-r from-kibako-primary via-kibako-secondary to-kibako-primary text-transparent bg-clip-text">
            プロジェクト一覧
          </h1>

          {/* リロード（プロジェクト一覧を最新化）ボタン - タイトルの左に移動（案B） */}
          <button
            onClick={() => {
              // クリック時に必ず1周アニメーションさせる（取得中は連続回転に切り替え）
              setIsReloadAnimating(true);
              if (refetch) refetch();
            }}
            disabled={!!isFetching}
            aria-label="プロジェクト一覧を最新化"
            title="プロジェクト一覧を最新化"
            className={`inline-flex items-center justify-center w-10 h-10 bg-kibako-white text-kibako-primary rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-kibako-primary transition-all duration-300 transform z-50
              ${isFetching ? 'opacity-80 cursor-not-allowed' : 'hover:scale-105'}`}
          >
            <IoReload
              // isFetching の間は連続回転。それ以外はクリック時に1周だけ回転。
              className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`}
              style={
                !isFetching && isReloadAnimating
                  ? {
                      // Tailwind の keyframes "spin" を1回だけ実行
                      animation: 'spin 1.2s linear 1',
                      display: 'inline-block',
                    }
                  : { display: 'inline-block' }
              }
              onAnimationEnd={() => {
                // 取得中でない時のみ、ワンショットアニメーションのフラグを戻す
                if (!isFetching) setIsReloadAnimating(false);
              }}
            />
          </button>
        </div>

        <div className="ml-0 md:ml-4 flex items-center gap-2">
          {/** 新規作成ボタン（右側に残す） */}
          <button
            onClick={handleCreatePrototype}
            disabled={isCreating}
            className={`inline-flex items-center gap-2 h-12 px-4 bg-kibako-white text-kibako-primary font-bold rounded-xl shadow-lg transition-all duration-300 transform z-50
          ${isCreating ? 'opacity-80 cursor-not-allowed' : 'hover:shadow-xl hover:scale-105'}`}
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
          </button>
        </div>
      </div>

      {/* プロジェクト一覧（カード形式） */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        {prototypeList.map(({ masterPrototype, project }) => {
          if (!masterPrototype) return null;
          const { id } = masterPrototype;
          const isNameEditing = isEditing(id);

          /**
           * カードクリック時の処理
           */
          const handleCardClick = () => {
            router.push(`/projects/${project.id}/prototypes/${id}`);
          };

          /**
           * ProjectCard用のイベントハンドラー
           */
          const handleProjectCardSubmit = (
            e: React.FormEvent<HTMLFormElement>
          ) => handleSubmit(e, handleNameEditComplete, validatePrototypeName);

          const handleProjectCardBlur = () =>
            handleBlur(handleNameEditComplete, validatePrototypeName);

          const handleProjectCardKeyDown = (
            e: React.KeyboardEvent<HTMLInputElement>
          ) => handleKeyDown(e, handleNameEditComplete, validatePrototypeName);

          return (
            <ProjectCard
              key={id}
              project={project}
              masterPrototype={masterPrototype}
              isNameEditing={isNameEditing}
              editedName={editedName}
              setEditedName={setEditedName}
              onCardClick={handleCardClick}
              onContextMenu={handleContextMenu}
              onSubmit={handleProjectCardSubmit}
              onBlur={handleProjectCardBlur}
              onKeyDown={handleProjectCardKeyDown}
            />
          );
        })}
      </div>

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
