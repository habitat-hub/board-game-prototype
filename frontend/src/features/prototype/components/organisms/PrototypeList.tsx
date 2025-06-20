'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
} from 'react';
import { FaCheck } from 'react-icons/fa';
import { FaSort, FaSortDown, FaSortUp } from 'react-icons/fa';
import { FaBoxOpen, FaPenToSquare, FaPlus } from 'react-icons/fa6';
import { RiLoaderLine } from 'react-icons/ri';

import { usePrototypeGroup } from '@/api/hooks/usePrototypeGroup';
import { usePrototypes } from '@/api/hooks/usePrototypes';
import { Prototype, PrototypeGroup } from '@/api/types';
import { UserContext } from '@/contexts/UserContext';
import formatDate from '@/utils/dateFormat';

import EmptyPrototypeList from '../molecules/EmptyPrototypeList';
import PrototypeListSkeleton from '../molecules/PrototypeListSkeleton';

type SortKey = 'name' | 'createdAt';
type SortOrder = 'asc' | 'desc';

/**
 * PrototypeListコンポーネントで使用される各種Stateの説明:
 *
 * @state nameEditingId - 現在プロトタイプ名を編集中のIDを管理するState。
 * @state editedName - 編集中のプロトタイプの名前を保持するState。
 * @state editPrototypes - 編集可能なプロトタイプのリストを保持するState。
 * @state sort - プロトタイプのソート条件（キーと順序）を管理するState。
 * @state isLoading - データ取得中のローディング状態を管理するState。
 */
const PrototypeList: React.FC = () => {
  const router = useRouter();
  const { updatePrototype } = usePrototypes();
  const { getPrototypeGroups, createPrototypeGroup } = usePrototypeGroup();
  // UserContextからユーザー情報を取得
  const userContext = useContext(UserContext);
  // ローディング状態を管理するState
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // プロトタイプ作成中フラグ
  const [isCreating, setIsCreating] = useState<boolean>(false);
  // 編集中のプロトタイプのIDを管理するState
  const [nameEditingId, setNameEditingId] = useState<string>('');
  // 編集中のプロトタイプの名前を保持するState
  const [editedName, setEditedName] = useState<string>('');
  // 編集用プロトタイプ
  const [prototypeList, setPrototypeList] = useState<
    {
      prototypeGroup: PrototypeGroup;
      editPrototype: Prototype | undefined;
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
   * 新しいプロトタイプを作成する
   */
  const handleCreatePrototype = async () => {
    try {
      setIsCreating(true);

      // ランダムな名前でプロトタイプを作成
      const randomName = generateRandomPrototypeName();
      const group = await createPrototypeGroup({
        name: randomName,
      });

      const masterPrototype = group.prototypes.find((p) => p.type === 'MASTER');

      if (!masterPrototype) {
        throw new Error('Cannot find a prototype with type "MASTER".');
      }

      // 編集ページへ遷移（成功時はページ遷移するのでsetIsCreating(false)は不要）
      router.push(
        `/groups/${group.prototypeGroup.id}/prototypes/${masterPrototype.id}/edit`
      );
    } catch (error) {
      console.error('Error creating prototype:', error);
      alert('プロトタイプの作成中にエラーが発生しました。');
      // エラーが発生した場合のみローディング状態を解除
      setIsCreating(false);
    }
  };

  /**
   * プロトタイプ名の編集モードを切り替える関数
   * @param id プロトタイプID
   * @param name プロトタイプ名
   */
  const handleNameEditToggle = (id: string, name: string) => {
    if (nameEditingId === id) {
      // 同じ項目を再度押した場合は編集モードを解除
      setNameEditingId('');
    } else {
      // 編集モードにする
      setNameEditingId(id);
      setEditedName(name);
    }
  };

  /**
   * プロトタイプ名の編集を完了する処理
   */
  const handleNameEditComplete = async () => {
    // 入力値のバリデーション
    if (!editedName.trim()) {
      alert('プロトタイプ名を入力してください');
      return;
    }

    try {
      const prototype = prototypeList.find(
        ({ editPrototype }) => editPrototype?.id === nameEditingId
      );
      if (!prototype) return;

      // 名前だけを更新
      await updatePrototype(nameEditingId, {
        name: editedName,
      });

      fetchPrototypeGroups();
    } catch (error) {
      console.error('Error updating prototype name:', error);
    } finally {
      // 編集モードを解除
      setNameEditingId('');
    }
  };

  /**
   * プロトタイプを取得する
   */
  const fetchPrototypeGroups = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await getPrototypeGroups();
      const prototypeInfo = response.map(({ prototypeGroup, prototypes }) => {
        return {
          prototypeGroup,
          editPrototype: prototypes.find(({ type }) => type === 'MASTER'),
        };
      });
      setPrototypeList(prototypeInfo);
    } catch (error) {
      console.error('Error fetching prototypes:', error);
    } finally {
      setIsLoading(false); // ローディング終了
    }
  }, [getPrototypeGroups]);

  // プロトタイプの取得
  useEffect(() => {
    fetchPrototypeGroups();
  }, [fetchPrototypeGroups]);

  /**
   * プロトタイプをソートする
   * @param prototypes プロトタイプ
   * @returns ソートされたプロトタイプ
   */
  const sortPrototypes = useCallback(
    (
      prototypeList: {
        prototypeGroup: PrototypeGroup;
        editPrototype: Prototype | undefined;
      }[]
    ) => {
      return [...prototypeList].sort((a, b) => {
        switch (sort.key) {
          // 名前順
          case 'name':
            if (!a.editPrototype?.name || !b.editPrototype?.name) return 0;
            return sort.order === 'asc'
              ? a.editPrototype.name.localeCompare(b.editPrototype.name)
              : b.editPrototype.name.localeCompare(a.editPrototype.name);
          // 作成日順
          case 'createdAt':
            if (!a.editPrototype?.createdAt || !b.editPrototype?.createdAt)
              return 0;
            return sort.order === 'asc'
              ? new Date(b.editPrototype.createdAt).getTime() -
                  new Date(a.editPrototype.createdAt).getTime()
              : new Date(a.editPrototype.createdAt).getTime() -
                  new Date(b.editPrototype.createdAt).getTime();
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

  if (isLoading) {
    return <PrototypeListSkeleton />;
  }

  if (sortedPrototypeList.length === 0) {
    return <EmptyPrototypeList />;
  }

  /**
   * ソートを変更する
   * @param key ソートキー
   */
  const handleSort = (key: SortKey) => {
    setSort((currentSort) =>
      currentSort.key === key
        ? {
            ...currentSort,
            order: currentSort.order === 'asc' ? 'desc' : 'asc',
          }
        : { key, order: 'desc' }
    );
  };

  // ソートアイコン
  const getSortIcon = (key: SortKey) => {
    if (sort.key !== key) return <FaSort className="w-4 h-4" />;
    return sort.order === 'asc' ? (
      <FaSortUp className="w-4 h-4" />
    ) : (
      <FaSortDown className="w-4 h-4" />
    );
  };

  return (
    <div className="max-w-4xl mx-auto mt-16 relative">
      {/* タイトル */}
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-header via-header-light to-header text-transparent bg-clip-text">
        プロトタイプ一覧
      </h1>
      {/* プロトタイプ一覧 */}
      <div className="shadow-2xl rounded-2xl overflow-hidden bg-content border border-wood-lightest/20">
        <table className="w-full border-collapse">
          <thead className="bg-content-secondary border-b border-wood-lightest/30">
            <tr className="text-sm font-medium text-wood-dark">
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 hover:text-header transition-colors duration-200 w-full"
                >
                  プロトタイプ名
                  {getSortIcon('name')}
                </button>
              </th>
              <th className="text-left p-4 w-56">
                <button
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center gap-1 hover:text-header transition-colors duration-200 w-full"
                >
                  作成日時
                  {getSortIcon('createdAt')}
                </button>
              </th>
              <th className="text-left p-4 w-32">作成者</th>
              <th className="text-center p-4 w-30"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-wood-lightest/20">
            {sortedPrototypeList.map(({ editPrototype, prototypeGroup }) => {
              if (!editPrototype) return null;
              const { id, name, createdAt } = editPrototype;
              const isNameEditing = nameEditingId === id;
              return (
                <tr key={id}>
                  <td className="p-4">
                    {isNameEditing ? (
                      <form
                        className="text-wood-darkest flex items-center"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleNameEditComplete();
                        }}
                      >
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="w-[80%] p-1 border border-wood-light rounded"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="ml-2 p-1.5 text-green-600 hover:text-green-700 rounded-md border border-green-500 hover:bg-green-50 transition-colors"
                          title="編集完了"
                        >
                          <FaCheck className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center">
                        <Link
                          href={`/groups/${prototypeGroup.id}`}
                          className="text-wood-darkest font-medium"
                        >
                          {name}
                        </Link>
                        <button
                          onClick={() => handleNameEditToggle(id, name)}
                          className="ml-2 p-1 text-wood hover:text-header rounded-md hover:bg-wood-lightest/20 transition-colors"
                          title="プロトタイプ名を編集"
                        >
                          <FaPenToSquare className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-sm text-wood">
                    {formatDate(createdAt, true)}
                  </td>
                  <td className="p-4 text-sm text-wood">
                    {userContext?.user?.id === prototypeGroup.userId
                      ? '自分'
                      : '他のユーザー'}
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    <Link
                      href={`groups/${prototypeGroup.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-wood hover:text-header rounded-md hover:bg-wood-lightest/20 transition-colors border border-wood-light/20"
                      title="プロトタイプを開く"
                    >
                      <FaBoxOpen className="w-4 h-4" />
                      <span>開く</span>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* 新規プロトタイプ作成ボタン */}
      <div className="mt-8 flex justify-center">
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
    </div>
  );
};

export default PrototypeList;
