'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Prototype } from '../type';

const PrototypeList: React.FC = () => {
  const [prototypes, setPrototypes] = useState<Prototype[]>([]);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    fetch(`${apiUrl}/api/prototypes`)
      .then((response) => response.json())
      .then((data) => setPrototypes(data))
      .catch((error) => console.error('Error fetching prototypes:', error));
  }, []);

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
          {prototypes.map((prototype) => (
            <li
              key={prototype.id}
              className="hover:bg-gray-100 transition-colors duration-200 flex justify-between items-center p-4"
            >
              {/* TODO: プロトタイプ名を編集できるようにする */}
              {/* TODO: ボタン以外をクリックしたら、編集画面に遷移する */}
              {/* TODO: 更新日時と更新者を表示する */}
              <span className="flex-1">{prototype.name}</span>
              <div className="flex space-x-2 ml-auto">
                <Link
                  href={`prototypes/edit/${prototype.id}`}
                  className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors"
                >
                  編集
                </Link>
                <Link
                  href={`prototypes/edit/${prototype.id}/preview`}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors"
                >
                  プレビュー版
                </Link>
                <Link
                  href={`prototypes/edit/${prototype.id}/published`}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                >
                  公開版
                </Link>
                <button
                  // TODO: 削除APIを作成する
                  onClick={() => {}}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                >
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PrototypeList;
