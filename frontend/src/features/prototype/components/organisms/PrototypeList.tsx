'use client';

import Link from 'next/link';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaCheck, FaCopy } from 'react-icons/fa';
import { FaSort, FaSortDown, FaSortUp } from 'react-icons/fa';
import { FaBoxOpen, FaPenToSquare, FaPlus } from 'react-icons/fa6';
import { GiWoodenSign } from 'react-icons/gi';

import { usePrototypes } from '@/api/hooks/usePrototypes';
import { Prototype } from '@/api/types';
import formatDate from '@/utils/dateFormat';

type SortKey = 'name' | 'createdAt';
type SortOrder = 'asc' | 'desc';

/**
 * PrototypeListコンポーネントで使用される各種Stateの説明:
 *
 * @state nameEditingId - 現在プロトタイプ名を編集中のIDを管理するState。
 * @state playersEditingId - 現在プレイ人数を編集中のIDを管理するState。
 * @state editedName - 編集中のプロトタイプの名前を保持するState。
 * @state editedMinPlayers - 編集中のプロトタイプの最小プレイヤー数を保持するState。
 * @state editedMaxPlayers - 編集中のプロトタイプの最大プレイヤー数を保持するState。
 * @state editPrototypes - 編集可能なプロトタイプのリストを保持するState。
 * @state sort - プロトタイプのソート条件（キーと順序）を管理するState。
 * @state isLoading - データ取得中のローディング状態を管理するState。
 */
const PrototypeList: React.FC = () => {
  const { getPrototypes, duplicatePrototype, updatePrototype } =
    usePrototypes();
  // ローディング状態を管理するState
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // 編集中のプロトタイプのIDを管理するState
  const [nameEditingId, setNameEditingId] = useState<string>('');
  const [playersEditingId, setPlayersEditingId] = useState<string>('');
  // 編集中のプロトタイプの名前を保持するState
  const [editedName, setEditedName] = useState<string>('');
  // 編集中のプロトタイプの最小プレイヤー数を保持するState
  const [editedMinPlayers, setEditedMinPlayers] = useState<number>(0);
  // 編集中のプロトタイプの最大プレイヤー数を保持するState
  const [editedMaxPlayers, setEditedMaxPlayers] = useState<number>(0);
  // 編集用プロトタイプ
  const [editPrototypes, setEditPrototypes] = useState<Prototype[]>([]);
  // ソート
  const [sort, setSort] = useState<{
    key: SortKey;
    order: SortOrder;
  }>({
    key: 'createdAt',
    order: 'desc',
  });

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
   * プレイ人数の編集モードを切り替える関数
   * @param id プロトタイプID
   * @param minPlayers 最小プレイヤー数
   * @param maxPlayers 最大プレイヤー数
   */
  const handlePlayersEditToggle = (
    id: string,
    minPlayers: number,
    maxPlayers: number
  ) => {
    if (playersEditingId === id) {
      // 同じ項目を再度押した場合は編集モードを解除
      setPlayersEditingId('');
    } else {
      // 編集モードにする
      setPlayersEditingId(id);
      setEditedMinPlayers(minPlayers);
      setEditedMaxPlayers(maxPlayers);
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
      const prototype = editPrototypes.find((p) => p.id === nameEditingId);
      if (!prototype) return;

      // 名前だけを更新
      await updatePrototype(nameEditingId, {
        name: editedName,
        minPlayers: prototype.minPlayers,
        maxPlayers: prototype.maxPlayers,
      });

      // ローカルの状態を更新
      setEditPrototypes((currentPrototypes) =>
        currentPrototypes.map((p) =>
          p.id === nameEditingId ? { ...p, name: editedName } : p
        )
      );
    } catch (error) {
      console.error('Error updating prototype name:', error);
    } finally {
      // 編集モードを解除
      setNameEditingId('');
    }
  };

  /**
   * プレイ人数の編集を完了する処理
   */
  const handlePlayersEditComplete = async () => {
    // プレイヤー人数のバリデーション
    if (editedMinPlayers < 1) {
      alert('最小プレイヤー数は1人以上に設定してください');
      return;
    }
    if (editedMaxPlayers < editedMinPlayers) {
      alert('最大プレイヤー数は最小プレイヤー数以上に設定してください');
      return;
    }

    try {
      const prototype = editPrototypes.find((p) => p.id === playersEditingId);
      if (!prototype) return;

      // プレイ人数だけを更新
      await updatePrototype(playersEditingId, {
        name: prototype.name,
        minPlayers: editedMinPlayers,
        maxPlayers: editedMaxPlayers,
      });

      // ローカルの状態を更新
      setEditPrototypes((currentPrototypes) =>
        currentPrototypes.map((p) =>
          p.id === playersEditingId
            ? {
                ...p,
                minPlayers: editedMinPlayers,
                maxPlayers: editedMaxPlayers,
              }
            : p
        )
      );
    } catch (error) {
      console.error('Error updating player count:', error);
    } finally {
      // 編集モードを解除
      setPlayersEditingId('');
    }
  };

  /**
   * プロトタイプを取得する
   */
  const fetchPrototypes = useCallback(async () => {
    setIsLoading(true);

    try {
      setIsLoading(true); // ローディング開始
      const response = await getPrototypes();
      setEditPrototypes(response.filter(({ type }) => type === 'EDIT'));
    } catch (error) {
      console.error('Error fetching prototypes:', error);
    } finally {
      setIsLoading(false); // ローディング終了
    }

    setIsLoading(false);
  }, [getPrototypes]);

  // プロトタイプの取得
  useEffect(() => {
    fetchPrototypes();
  }, [fetchPrototypes]);

  /**
   * プロトタイプをソートする
   * @param prototypes プロトタイプ
   * @returns ソートされたプロトタイプ
   */
  const sortPrototypes = useCallback(
    (prototypes: Prototype[]) => {
      return [...prototypes].sort((a, b) => {
        switch (sort.key) {
          // 名前順
          case 'name':
            return sort.order === 'asc'
              ? a.name.localeCompare(b.name)
              : b.name.localeCompare(a.name);
          // 作成日順
          case 'createdAt':
            return sort.order === 'asc'
              ? new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              : new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime();
          default:
            return 0;
        }
      });
    },
    [sort]
  );

  // ソートされたプロトタイプ
  const sortedPrototypes = useMemo(
    () => sortPrototypes(editPrototypes),
    [editPrototypes, sortPrototypes]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col h-full justify-center items-center">
        <p className="text-2xl text-wood-darkest">Loading...</p>
      </div>
    );
  }

  if (sortedPrototypes.length === 0) {
    return (
      <div className="flex flex-col h-full justify-center items-center relative">
        <div className="text-wood-light">
          <GiWoodenSign className="w-[600px] h-[600px]" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <p className="text-4xl text-wood-darkest text-center w-full mb-12">
            最初のプロトタイプを
            <br />
            作成しましょう
          </p>
          <Link
            href="/prototypes/create"
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-header via-header-light to-header text-content py-4 px-8 rounded-full hover:from-header-light hover:via-header hover:to-header-light transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 group text-xl font-bold animate-pulse"
            title="新規プロトタイプを作成"
          >
            <FaPlus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            <span>KIBAKOの世界へ飛び込む！</span>
          </Link>
        </div>
      </div>
    );
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

  // プロトタイプを複製する
  const handleDuplicate = async (prototypeId: string, e: React.MouseEvent) => {
    e.preventDefault(); // リンククリックのイベントバブリングを防止
    try {
      await duplicatePrototype(prototypeId);
      fetchPrototypes(); // 一覧を更新
    } catch (error) {
      console.error('Error duplicating prototype:', error);
    }
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
    <div className="max-w-4xl mx-auto mt-16 relative pb-24">
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
              <th className="text-left p-4 w-36">プレイ人数</th>
              <th className="text-left p-4 w-32">
                <button
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center gap-1 hover:text-header transition-colors duration-200 w-full"
                >
                  作成日
                  {getSortIcon('createdAt')}
                </button>
              </th>
              <th className="text-center p-4 w-48">アクション</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-wood-lightest/20">
            {sortedPrototypes.map(
              ({ id, groupId, name, minPlayers, maxPlayers, createdAt }) => {
                const isNameEditing = nameEditingId === id; // 現在の項目が編集中かどうかを判定
                const isPlayersEditing = playersEditingId === id; // 現在の項目が編集中かどうかを判定
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
                            href={`prototypes/groups/${groupId}`}
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
                    <td className="p-4">
                      {isPlayersEditing ? (
                        <form
                          className="flex items-center gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            handlePlayersEditComplete();
                          }}
                        >
                          <input
                            type="number"
                            value={editedMinPlayers}
                            onChange={(e) =>
                              setEditedMinPlayers(Number(e.target.value))
                            }
                            className="w-16 p-1 border border-wood-light rounded"
                            autoFocus
                          />
                          <span>~</span>
                          <input
                            type="number"
                            value={editedMaxPlayers}
                            onChange={(e) =>
                              setEditedMaxPlayers(Number(e.target.value))
                            }
                            className="w-16 p-1 border border-wood-light rounded"
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
                          <span className="text-wood-dark">
                            {minPlayers !== maxPlayers
                              ? `${minPlayers} ~ ${maxPlayers}`
                              : `${minPlayers}`}
                          </span>
                          <button
                            onClick={() =>
                              handlePlayersEditToggle(
                                id,
                                minPlayers,
                                maxPlayers
                              )
                            }
                            className="ml-2 p-1 text-wood hover:text-header rounded-md hover:bg-wood-lightest/20 transition-colors"
                            title="プレイ人数を編集"
                          >
                            <FaPenToSquare className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-wood w-32">
                      {formatDate(createdAt)}
                    </td>
                    <td className="p-4 flex justify-center gap-2">
                      <Link
                        href={`prototypes/groups/${groupId}`}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-wood hover:text-header rounded-md hover:bg-wood-lightest/20 transition-colors border border-wood-light/20"
                        title="プロトタイプを開く"
                      >
                        <FaBoxOpen className="w-4 h-4" />
                        <span>開く</span>
                      </Link>
                      <button
                        onClick={(e) => handleDuplicate(id, e)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-wood hover:text-header rounded-md hover:bg-wood-lightest/20 transition-colors border border-wood-light/20"
                        title="プロトタイプを複製"
                      >
                        <FaCopy className="w-4 h-4" />
                        <span>複製</span>
                      </button>
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>
      {/* 新規プロトタイプ作成ボタン */}
      <div className="mt-6 flex justify-center">
        <Link
          href="/prototypes/create"
          className="flex items-center justify-center gap-3 bg-gradient-to-r from-header via-header-light to-header text-content py-3 px-6 rounded-full hover:from-header-light hover:via-header hover:to-header-light transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 group"
          title="新規プロトタイプを作成"
        >
          <FaPlus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-bold">新しいプロトタイプを作成</span>
        </Link>
      </div>
    </div>
  );
};

export default PrototypeList;
