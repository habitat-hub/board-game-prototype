'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import { Prototype } from '@/features/prototype/type';
import axiosInstance from '@/utils/axiosInstance';

import { PROTOTYPE_TYPE } from '../../const';

const PrototypeList: React.FC = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [editPrototypes, setEditPrototypes] = useState<Prototype[]>([]);

  // プロトタイプを取得する
  useEffect(() => {
    axiosInstance
      .get(`${apiUrl}/api/prototypes`)
      .then((response) =>
        setEditPrototypes(
          response.data.filter(
            ({ type }: { type: string }) => type === PROTOTYPE_TYPE.EDIT
          )
        )
      )
      .catch((error) => console.error('Error fetching prototypes:', error));
  }, [apiUrl]);

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
          {editPrototypes.map(
            ({ id, groupId, name, minPlayers, maxPlayers }) => {
              return (
                <Link key={id} href={`prototypes/groups/${groupId}`}>
                  <li className="hover:bg-gray-100 transition-colors duration-200 flex justify-between items-center p-4">
                    <span className="flex-1">
                      {name} -{' '}
                      {minPlayers !== maxPlayers
                        ? `${minPlayers} 〜 ${maxPlayers} 人用ゲーム`
                        : `${minPlayers} 人用ゲーム`}
                    </span>
                  </li>
                </Link>
              );
            }
          )}
        </ul>
      </div>
    </div>
  );
};

export default PrototypeList;
