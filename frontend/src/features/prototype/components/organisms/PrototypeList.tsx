'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Prototype } from '@/features/prototype/type';
import axiosInstance from '@/utils/axiosInstance';

const PrototypeList: React.FC = () => {
  const [prototypes, setPrototypes] = useState<Prototype[]>([]);

  /**
   * プロトタイプを取得する
   */
  const fetchPrototypes = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    axiosInstance
      .get(`${apiUrl}/api/prototypes`)
      .then((response) => setPrototypes(response.data))
      .catch((error) => console.error('Error fetching prototypes:', error));
  };

  useEffect(() => {
    fetchPrototypes();
  }, []);

  // グループIDごとにプロトタイプを分類
  const groupedPrototypes = prototypes.reduce((acc, prototype) => {
    if (!acc[prototype.groupId]) {
      acc[prototype.groupId] = [];
    }
    acc[prototype.groupId].push(prototype);
    return acc;
  }, {} as Record<number, Prototype[]>);

  /**
   * プロトタイプを削除する
   * @param id - 削除するプロトタイプのID
   */
  const handleDelete = async (id: number) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    try {
      await axiosInstance.delete(`${apiUrl}/api/prototypes/${id}`);
      fetchPrototypes(); // 削除後に再fetch
    } catch (error) {
      console.error('Error deleting prototype:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-8 text-center">
        ボードゲームプロトタイプ一覧
      </h1>
      <div className="mb-8 text-center">
        <Link
          href="/prototypes/create"
          className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          新規作成
        </Link>
      </div>
      <div className="shadow-lg rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {Object.entries(groupedPrototypes).map(
            ([groupId, groupPrototypes]) => {
              const editPrototype = groupPrototypes.find((p) => p.isEdit);
              const previewPrototype = groupPrototypes.find((p) => p.isPreview);
              const publishedPrototype = groupPrototypes.find(
                (p) => p.isPublic
              );

              return (
                <li
                  key={groupId}
                  className="hover:bg-gray-100 transition-colors duration-200 flex justify-between items-center p-4"
                >
                  {/* TODO: プロトタイプ名を編集できるようにする */}
                  {/* TODO: ボタン以外をクリックしたら、編集画面に遷移する */}
                  {/* TODO: 更新日時と更新者を表示する */}
                  <span className="flex-1">
                    {editPrototype?.name} - {editPrototype?.players.length}
                    人用ゲーム
                  </span>
                  <div className="flex space-x-2 ml-auto">
                    <Link
                      href={`prototypes/${editPrototype?.id}/edit`}
                      className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors"
                    >
                      編集
                    </Link>
                    <Link
                      href={`prototypes/${previewPrototype?.id}/preview`}
                      className={`bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors ${
                        !previewPrototype ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      onClick={(e) => !previewPrototype && e.preventDefault()}
                    >
                      プレビュー版
                    </Link>
                    <Link
                      href={`prototypes/${publishedPrototype?.id}/published`}
                      className={`bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors ${
                        !publishedPrototype
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                      onClick={(e) => !publishedPrototype && e.preventDefault()}
                    >
                      公開版
                    </Link>
                    <button
                      onClick={() => {
                        if (editPrototype) {
                          handleDelete(editPrototype.id);
                        }
                        if (previewPrototype) {
                          handleDelete(previewPrototype.id);
                        }
                        if (publishedPrototype) {
                          handleDelete(publishedPrototype.id);
                        }
                      }}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </li>
              );
            }
          )}
        </ul>
      </div>
    </div>
  );
};

export default PrototypeList;
