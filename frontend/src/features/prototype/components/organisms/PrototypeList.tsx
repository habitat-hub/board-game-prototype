'use client';

import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';
import { FaCopy } from 'react-icons/fa';
import { FaSort, FaSortDown, FaSortUp } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa6';

import { PROTOTYPE_TYPE } from '@/features/prototype/const';
import { Prototype } from '@/types/models';
import axiosInstance from '@/utils/axiosInstance';
import formatDate from '@/utils/dateFormat';

type SortKey = 'name' | 'createdAt';
type SortOrder = 'asc' | 'desc';

const PrototypeList: React.FC = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [editPrototypes, setEditPrototypes] = useState<Prototype[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // ソート関数
  const sortPrototypes = useCallback(
    (prototypes: Prototype[]) => {
      return [...prototypes].sort((a, b) => {
        const compareValue =
          sortKey === 'createdAt'
            ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            : a[sortKey].localeCompare(b[sortKey]);
        return sortOrder === 'asc' ? -compareValue : compareValue;
      });
    },
    [sortKey, sortOrder]
  );

  const handleSort = (key: SortKey) => {
    setSortOrder((currentOrder) =>
      sortKey === key ? (currentOrder === 'asc' ? 'desc' : 'asc') : 'desc'
    );
    setSortKey(key);
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <FaSort className="w-4 h-4" />;
    return sortOrder === 'asc' ? (
      <FaSortUp className="w-4 h-4" />
    ) : (
      <FaSortDown className="w-4 h-4" />
    );
  };

  /**
   * プロトタイプを取得する
   */
  const fetchPrototypes = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`${apiUrl}/api/prototypes`);
      setEditPrototypes(
        response.data.filter(
          ({ type }: { type: string }) => type === PROTOTYPE_TYPE.EDIT
        )
      );
    } catch (error) {
      console.error('Error fetching prototypes:', error);
    }
  }, [apiUrl]);

  // プロトタイプを取得する
  useEffect(() => {
    fetchPrototypes();
  }, [apiUrl, fetchPrototypes]);

  // プロトタイプを複製する
  const handleDuplicate = async (prototypeId: string, e: React.MouseEvent) => {
    e.preventDefault(); // リンククリックのイベントバブリングを防止
    try {
      await axiosInstance.post(
        `${apiUrl}/api/prototypes/${prototypeId}/duplicate`
      );
      fetchPrototypes(); // 一覧を更新
    } catch (error) {
      console.error('Error duplicating prototype:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-16 relative pb-24">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-header via-header-light to-header text-transparent bg-clip-text">
        ボードゲームプロトタイプ一覧
      </h1>
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
          {sortPrototypes(editPrototypes).map(
            ({ id, groupId, name, minPlayers, maxPlayers, createdAt }) => (
              <li
                key={id}
                className="hover:bg-content-secondary/50 transition-colors duration-200 flex items-center p-4"
              >
                <Link
                  href={`prototypes/groups/${groupId}`}
                  className="flex-1 flex items-center"
                >
                  <span className="flex-1 text-wood-darkest">
                    <span className="font-medium">{name}</span>
                    <span className="mx-2 text-wood-light">|</span>
                    <span className="text-wood-dark">
                      {minPlayers !== maxPlayers
                        ? `${minPlayers} 〜 ${maxPlayers} 人用ゲーム`
                        : `${minPlayers} 人用ゲーム`}
                    </span>
                  </span>
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
              </li>
            )
          )}
        </ul>
      </div>
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
