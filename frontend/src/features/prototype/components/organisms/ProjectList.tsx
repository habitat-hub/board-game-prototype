'use client';

import { useRouter } from 'next/navigation';
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
} from 'react';
import {
  FaPlus,
  FaSort,
  FaSortDown,
  FaSortUp,
} from 'react-icons/fa';
import { GiWoodenCrate, GiCardAceSpades, GiPuzzle } from 'react-icons/gi';
import { RiLoaderLine } from 'react-icons/ri';

import { useProject } from '@/api/hooks/useProject';
import { usePrototypes } from '@/api/hooks/usePrototypes';
import { Prototype, Project } from '@/api/types';
import Loading from '@/components/organisms/Loading';
import { UserContext } from '@/contexts/UserContext';
import useInlineEdit from '@/hooks/useInlineEdit';
import formatDate from '@/utils/dateFormat';
import { deleteExpiredImagesFromIndexedDb } from '@/utils/db';
import { ProjectContextMenu } from '../atoms/ProjectContextMenu';
import { createPortal } from 'react-dom';

type SortKey = 'name' | 'createdAt';
type SortOrder = 'asc' | 'desc';

/**
 * PrototypeListコンポーネントで使用される各種Stateの説明:
 *
 * @state isLoading - データ取得中のローディング状態を管理するState。
 * @state isCreating - プロトタイプ作成中のローディング状態を管理するState。
 * @state prototypeList - プロジェクトとプロトタイプのリストを保持するState。
 * @state sort - プロトタイプのソート条件（キーと順序）を管理するState。
 *
 * 編集機能はuseInlineEditカスタムフックで管理されています。
 */
const ProjectList: React.FC = () => {
  const router = useRouter();
  const { updatePrototype } = usePrototypes();
  const { getProjects, createProject } = useProject();
  // UserContextからユーザー情報を取得
  const userContext = useContext(UserContext);
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
  // ローディング状態を管理するState
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // プロトタイプ作成中フラグ
  const [isCreating, setIsCreating] = useState<boolean>(false);
  // 編集用プロトタイプ
  const [prototypeList, setPrototypeList] = useState<
    {
      project: Project;
      masterPrototype: Prototype | undefined;
    }[]
  >([]);
  // ソート
  const [sort, setSort] = useState<{
    key: SortKey;
    order: SortOrder;
  }>({
    key: 'createdAt',
    order: 'desc',
  });

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

    return `${randomAdjective}な${randomNoun}`;
  };

  /**
   * ランダムなアイコンを取得する
   * @param id プロトタイプID（一意性を保つため）
   * @returns アイコンコンポーネント
   */
  const getRandomIcon = (id: string) => {
    const icons = [GiWoodenCrate, GiCardAceSpades, GiPuzzle];
    // IDをもとにハッシュ値を生成して一意性を保つ
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const iconIndex = hash % icons.length;
    const IconComponent = icons[iconIndex];
    
    return <IconComponent className="w-20 h-20 text-white/80" />;
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

      // masterプロトタイプの名前をAPIで更新
      await updatePrototype(nameEditingId, {
        name: newName.trim(),
      });

      setPrototypeList((prevList) =>
        prevList.map((item) => {
          if (item.masterPrototype?.id === nameEditingId) {
            return {
              ...item,
              masterPrototype: {
                ...item.masterPrototype,
                name: newName.trim(),
              },
            };
          }
          return item;
        })
      );
    } catch (error) {
      console.error('Error updating prototype name:', error);
      throw new Error('プロトタイプ名の更新中にエラーが発生しました。');
    }
  };

  /**
   * プロトタイプを取得する
   */
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await getProjects();
      const prototypeInfo = response.map(({ project, prototypes }) => {
        return {
          project,
          masterPrototype: prototypes.find(({ type }) => type === 'MASTER'),
        };
      });
      setPrototypeList(prototypeInfo);
    } catch (error) {
      console.error('Error fetching prototypes:', error);
    } finally {
      setIsLoading(false); // ローディング終了
    }
  }, [getProjects]);

  // プロトタイプ名のバリデーション関数
  const validatePrototypeName = (value: string): string | null => {
    if (!value.trim()) {
      return 'プロトタイプ名を入力してください';
    }
    return null;
  };

  // プロトタイプの取得
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  /**
   * プロトタイプをソートする
   * @param prototypes プロトタイプ
   * @returns ソートされたプロトタイプ
   */
  const sortPrototypes = useCallback(
    (
      prototypeList: {
        project: Project;
        masterPrototype: Prototype | undefined;
      }[]
    ) => {
      return [...prototypeList].sort((a, b) => {
        switch (sort.key) {
          // 名前順
          case 'name':
            if (!a.masterPrototype?.name || !b.masterPrototype?.name) return 0;
            return sort.order === 'asc'
              ? a.masterPrototype.name.localeCompare(b.masterPrototype.name)
              : b.masterPrototype.name.localeCompare(a.masterPrototype.name);
          // 作成日順
          case 'createdAt':
            if (!a.masterPrototype?.createdAt || !b.masterPrototype?.createdAt)
              return 0;
            return sort.order === 'asc'
              ? new Date(b.masterPrototype.createdAt).getTime() -
                  new Date(a.masterPrototype.createdAt).getTime()
              : new Date(a.masterPrototype.createdAt).getTime() -
                  new Date(b.masterPrototype.createdAt).getTime();
          default:
            return 0;
        }
      });
    },
    [sort]
  );

  // ソートされたプロトタイプ
  const sortedPrototypeList = useMemo(() => {
    return sortPrototypes(prototypeList);
  }, [prototypeList, sortPrototypes]);

  /**
   * 右クリック時の処理
   */
  const handleContextMenu = (
    e: React.MouseEvent,
    project: Project,
    masterPrototype: Prototype
  ) => {
    e.preventDefault();
    console.info('handleContextMenu');
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
  const getContextMenuItems = (project: Project, masterPrototype: Prototype) => [
    {
      id: 'rename',
      text: '名前の変更',
      action: () => {
        handleNameEditToggle(masterPrototype.id, masterPrototype.name);
      },
    },
    {
      id: 'permissions',
      text: '権限',
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

  if (isLoading) {
    return <Loading />;
  }

  if (sortedPrototypeList.length === 0) {
    return (
      <div className="fixed inset-0 z-10">
        <button
          onClick={handleCreatePrototype}
          disabled={isCreating}
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-row items-center justify-center gap-4 px-14 py-8 rounded-3xl shadow-[0_10px_40px_0_rgba(0,0,0,0.45),0_2px_8px_0_rgba(0,0,0,0.25)] bg-kibako-primary text-kibako-white text-2xl font-bold transition-all duration-200 border-4 border-kibako-accent hover:bg-kibako-accent hover:text-kibako-primary hover:scale-105 hover:shadow-[0_16px_56px_0_rgba(0,0,0,0.55),0_4px_16px_0_rgba(0,0,0,0.30)] active:scale-95 focus:outline-none focus:ring-4 focus:ring-kibako-accent/40 select-none ${isCreating ? 'opacity-80 cursor-not-allowed' : ''}`}
          style={{ minWidth: 360, minHeight: 100 }}
          title="新規プロトタイプを作成する"
        >
          {isCreating ? (
            <RiLoaderLine
              className="w-14 h-14 animate-spin text-kibako-primary bg-kibako-accent rounded-full p-2 shadow-lg"
              aria-hidden="true"
            />
          ) : (
            <GiWoodenCrate
              className="w-20 h-20 text-kibako-accent drop-shadow-xl transform -rotate-6 bg-white rounded-2xl p-2 shadow-lg border-2 border-kibako-accent"
              aria-hidden="true"
            />
          )}
          <span className="text-2xl font-bold tracking-wide drop-shadow-sm">
            {isCreating ? '作成中...' : 'KIBAKOの世界へ飛び込む！'}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-16 relative px-4">
      {/* タイトル */}
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-header via-header-light to-header text-transparent bg-clip-text">
        プロトタイプ一覧
      </h1>

      {/* プロトタイプ一覧（カード形式） */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {sortedPrototypeList.map(({ masterPrototype, project }) => {
          if (!masterPrototype) return null;
          const { id, name, createdAt } = masterPrototype;
          const isNameEditing = isEditing(id);
          
          /**
           * カードダブルクリック時の処理
           */
          const handleCardDoubleClick = () => {
            router.push(`/projects/${project.id}/prototypes/${id}`);
          };
          
          return (
            <div
              key={id}
              className="bg-content border border-wood-lightest/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
              onDoubleClick={handleCardDoubleClick}
              onContextMenu={(e) => {
                e.preventDefault();
                handleContextMenu(e, project, masterPrototype);
              }}
              title="ダブルクリックで編集 / 右クリックでメニュー表示"
            >
              {/* カード画像エリア */}
              <div className="relative h-48 bg-gradient-to-br from-header via-header-light to-header-light/80 flex items-center justify-center">
                {getRandomIcon(id)}
                <div className="absolute inset-0 bg-black/10 rounded-t-xl"></div>
              </div>

              {/* カード内容 */}
              <div className="p-4 space-y-4">
                {/* プロトタイプ名 */}
                <div className="min-h-[25px] flex items-center">
                  {isNameEditing ? (
                    <form
                      className="w-full"
                      onSubmit={(e) =>
                        handleSubmit(
                          e,
                          handleNameEditComplete,
                          validatePrototypeName
                        )
                      }
                    >
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onBlur={() =>
                          handleBlur(
                            handleNameEditComplete,
                            validatePrototypeName
                          ).catch((error) => {
                            console.error('Error in onBlur:', error);
                            alert(error.message || 'エラーが発生しました');
                          })
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(
                            e,
                            handleNameEditComplete,
                            validatePrototypeName
                          ).catch((error) => {
                            console.error('Error in onKeyDown:', error);
                            alert(error.message || 'エラーが発生しました');
                          })
                        }
                        className="w-full text-wood-darkest font-semibold bg-transparent border border-transparent rounded-md p-2 -m-2 focus:outline-none focus:bg-white focus:border-header focus:shadow-sm transition-all text-lg"
                        autoFocus
                      />
                    </form>
                  ) : (
                    <span className="text-wood-darkest font-semibold hover:text-header transition-colors cursor-pointer p-2 -m-2 rounded-md hover:bg-wood-lightest/20 text-left text-lg leading-tight"
                      title="クリックして編集"
                    >
                      {name}
                    </span>
                  )}
                </div>
                {/* 詳細情報 */}
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <div className="text-right text-xs text-wood/60 space-y-1">
                      <div>
                        作成者: {userContext?.user?.id === project.userId
                          ? '自分'
                          : '他のユーザー'}
                      </div>
                      <div>作成日時: {formatDate(createdAt, true)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 新規プロトタイプ作成ボタン */}
      <div className="flex justify-center">
        <button
          onClick={handleCreatePrototype}
          disabled={isCreating}
          className={`w-full max-w-md bg-gradient-to-r from-header/90 to-header-light/90 text-white p-3 rounded-xl border border-header/20 font-medium transition-all duration-300 transform 
            ${
              isCreating
                ? 'opacity-80 cursor-not-allowed'
                : 'hover:shadow-xl hover:-translate-y-1'
            }`}
        >
          <div className="flex items-center justify-center">
            {isCreating && (
              <RiLoaderLine className="w-5 h-5 mr-2 animate-spin" />
            )}
            <FaPlus className={`w-5 h-5 mr-2 ${isCreating ? 'hidden' : ''}`} />
            <span>{isCreating ? '作成中...' : '新しいプロトタイプを作成'}</span>
          </div>
        </button>
      </div>
      {/* コンテキストメニュー */}
      {contextMenu.targetProject && createPortal(
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
        />
      , document.body)}
    </div>
  );
};

export default ProjectList;
