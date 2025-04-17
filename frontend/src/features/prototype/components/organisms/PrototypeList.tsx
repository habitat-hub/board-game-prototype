'use client';

import Link from 'next/link';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaCopy } from 'react-icons/fa';
import { FaSort, FaSortDown, FaSortUp } from 'react-icons/fa';
import { FaPenToSquare, FaPlus } from 'react-icons/fa6';
import { GiWoodenSign } from 'react-icons/gi';

import { usePrototypes } from '@/api/hooks/usePrototypes';
import { Prototype } from '@/api/types';
import formatDate from '@/utils/dateFormat';

type SortKey = 'name' | 'createdAt';
type SortOrder = 'asc' | 'desc';

/**
 * PrototypeListコンポーネントで使用される各種Stateの説明:
 *
 * @state editingId - 現在編集中のプロトタイプのIDを管理するState。
 * @state editedName - 編集中のプロトタイプの名前を保持するState。
 * @state editedMinPlayers - 編集中のプロトタイプの最小プレイヤー数を保持するState。
 * @state editedMaxPlayers - 編集中のプロトタイプの最大プレイヤー数を保持するState。
 * @state editPrototypes - 編集可能なプロトタイプのリストを保持するState。
 * @state sort - プロトタイプのソート条件（キーと順序）を管理するState。
 */
const PrototypeList: React.FC = () => {
  const { getPrototypes, duplicatePrototype, updatePrototype } =
    usePrototypes();
  // 編集中のプロトタイプのIDを管理するState
  const [editingId, setEditingId] = useState<string>('');
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
   * 編集モードの切り替えを行う関数。
   *
   * @param id - 編集対象の項目のID。
   * @param name - 編集対象の項目の名前。
   * @param minPlayers - 編集対象の項目の最小プレイヤー数。
   * @param maxPlayers - 編集対象の項目の最大プレイヤー数。
   *
   * @returns void
   */
  const handleEditToggle = (
    id: string,
    name: string,
    minPlayers: number,
    maxPlayers: number
  ) => {
    if (editingId === id) {
      // 同じ項目を再度押した場合は編集モードを解除
      setEditingId('');
    } else {
      // 編集モードにする
      setEditingId(id);
      setEditedName(name);
      setEditedMinPlayers(minPlayers);
      setEditedMaxPlayers(maxPlayers);
    }
  };

  /**
   * プロトタイプの編集操作を完了する処理。
   *
   * @returns void
   */
  const handleEditComplete = async () => {
    try {
      // プロトタイプを作成する
      await updatePrototype(editingId, {
        name: editedName,
        minPlayers: editedMinPlayers,
        maxPlayers: editedMaxPlayers,
      });
      fetchPrototypes(); // 一覧を更新
    } catch (error) {
      console.error('Error creating prototype:', error);
    } finally {
      // 編集モードを解除
      setEditingId(''); // 編集モードを解除
    }
  };

  /**
   * プロトタイプを取得する
   */
  const fetchPrototypes = useCallback(async () => {
    try {
      const response = await getPrototypes();
      setEditPrototypes(response.filter(({ type }) => type === 'EDIT'));
    } catch (error) {
      console.error('Error fetching prototypes:', error);
    }
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

  if (sortedPrototypes.length === 0) {
    return (
      <div className="flex text-wood-light h-full justify-center items-center flex-col relative">
        <GiWoodenSign className="w-[300px] h-[300px]" />
        <p className="text-sm absolute bottom-[51%] text-wood-darkest">
          プロトタイプ未作成
        </p>
        <Link
          href="/prototypes/create"
          className="fixed bottom-10 right-10 w-14 h-14 flex items-center justify-center bg-gradient-to-r from-header via-header-light to-header text-content rounded-full hover:from-header-light hover:via-header hover:to-header-light transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 group"
          title="新規プロトタイプを作成"
        >
          <FaPlus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </Link>
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
        ボードゲームプロトタイプ一覧
      </h1>
      {/* プロトタイプ一覧 */}
      <div className="shadow-2xl rounded-2xl overflow-hidden bg-content border border-wood-lightest/20">
        <div className="bg-content-secondary border-b border-wood-lightest/30">
          <div className="flex items-center p-4 text-sm font-medium text-wood-dark">
            <button
              onClick={() => handleSort('name')}
              className="flex-1 flex items-center gap-1 hover:text-header transition-colors duration-200"
            >
              プロトタイプ名
              {getSortIcon('name')}
            </button>
            <button
              onClick={() => handleSort('createdAt')}
              className="w-32 flex items-center gap-1 hover:text-header transition-colors duration-200"
            >
              作成日
              {getSortIcon('createdAt')}
            </button>
            <div className="w-24" />
          </div>
        </div>
        <ul className="divide-y divide-wood-lightest/20">
          {sortedPrototypes.map(
            ({ id, groupId, name, minPlayers, maxPlayers, createdAt }) => {
              const isEditing = editingId === id; // 現在の項目が編集中かどうかを判定
              return (
                <li
                  key={id}
                  className="hover:bg-content-secondary/50 transition-colors duration-200 flex items-center p-4"
                >
                  <Link
                    href={`prototypes/groups/${groupId}`}
                    className="flex-1 flex items-center"
                    onClick={(e) => {
                      if (isEditing) {
                        e.preventDefault(); // 編集中の場合は画面遷移をキャンセル
                      }
                    }}
                  >
                    {isEditing ? (
                      <div className="flex-1 text-wood-darkest">
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="w-[80%] mb-2 p-1 border border-wood-light rounded"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editedMinPlayers}
                            onChange={(e) =>
                              setEditedMinPlayers(Number(e.target.value))
                            }
                            className="w-20 p-1 border border-wood-light rounded"
                          />
                          <span>〜</span>
                          <input
                            type="number"
                            value={editedMaxPlayers}
                            onChange={(e) =>
                              setEditedMaxPlayers(Number(e.target.value))
                            }
                            className="w-20 p-1 border border-wood-light rounded"
                          />
                          <span>人用ゲーム</span>
                        </div>
                      </div>
                    ) : (
                      <span className="flex-1 text-wood-darkest">
                        <span className="font-medium">{name}</span>
                        <span className="mx-2 text-wood-light">|</span>
                        <span className="text-wood-dark">
                          {minPlayers !== maxPlayers
                            ? `${minPlayers} 〜 ${maxPlayers} 人用ゲーム`
                            : `${minPlayers} 人用ゲーム`}
                        </span>
                      </span>
                    )}
                    <span className="w-32 text-sm text-wood">
                      {formatDate(createdAt)}
                    </span>
                  </Link>
                  <button
                    onClick={(e) => handleDuplicate(id, e)}
                    className="w-24 flex items-center gap-1 ml-4 px-3 py-1.5 text-sm text-wood hover:text-header rounded-md hover:bg-wood-lightest/20 transition-colors border border-wood-light/20"
                    title="プロトタイプを複製"
                  >
                    <FaCopy className="w-4 h-4" />
                    <span>複製</span>
                  </button>
                  {isEditing ? (
                    <button
                      onClick={() => handleEditComplete()}
                      className="w-24 flex items-center gap-1 ml-4 px-3 py-1.5 text-sm text-wood hover:text-header rounded-md hover:bg-wood-lightest/20 transition-colors border border-wood-light/20"
                      title="編集完了"
                    >
                      <FaPenToSquare className="w-4 h-4" />
                      <span>完了</span>
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        handleEditToggle(id, name, minPlayers, maxPlayers)
                      }
                      className="w-24 flex items-center gap-1 ml-4 px-3 py-1.5 text-sm text-wood hover:text-header rounded-md hover:bg-wood-lightest/20 transition-colors border border-wood-light/20"
                      title="プロトタイプを編集"
                    >
                      <FaPenToSquare className="w-4 h-4" />
                      <span>編集</span>
                    </button>
                  )}
                </li>
              );
            }
          )}
        </ul>
      </div>
      {/* 新規プロトタイプ作成ボタン */}
      <Link
        href="/prototypes/create"
        className="fixed bottom-10 right-10 w-14 h-14 flex items-center justify-center bg-gradient-to-r from-header via-header-light to-header text-content rounded-full hover:from-header-light hover:via-header hover:to-header-light transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 group"
        title="新規プロトタイプを作成"
      >
        <FaPlus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      </Link>
    </div>
  );
};

export default PrototypeList;
