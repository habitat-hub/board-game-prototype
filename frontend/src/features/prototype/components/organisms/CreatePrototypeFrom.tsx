'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/utils/axiosInstance';

const CreatePrototypeForm: React.FC = () => {
  const [name, setName] = useState('');
  const [playerCount, setPlayerCount] = useState<number>(4); // 初期値を4に設定
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  /**
   * プロトタイプを作成する
   * @param event - イベント
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || playerCount <= 0) {
      setError('プロトタイプ名とプレイヤー人数を入力してください。');
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      await axiosInstance.post(`${apiUrl}/api/prototypes`, {
        name,
        playerCount,
      });

      setName('');
      setPlayerCount(4); // 初期値にリセット
      setError(null);
      router.push('/prototypes');
    } catch (error) {
      console.error('Error creating prototype:', error);
      setError('エラーが発生しました。');
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto mt-10 p-4 bg-white shadow-md rounded-lg"
      >
        <h2 className="text-xl font-bold mb-4 text-center">
          新しいプロトタイプを作成
        </h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <div className="mb-4">
          <label htmlFor="prototypeName" className="block text-gray-700 mb-2">
            プロトタイプ名
          </label>
          <input
            id="prototypeName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="プロトタイプ名"
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="playerCount" className="block text-gray-700 mb-2">
            プレイヤー人数
          </label>
          <input
            id="playerCount"
            type="number"
            value={playerCount}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value >= 0) {
                setPlayerCount(value);
              }
            }}
            placeholder="プレイヤー人数"
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
        >
          作成
        </button>
      </form>
      <div className="text-center mt-4">
        <Link
          href="/prototypes"
          className="inline-block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
        >
          戻る
        </Link>
      </div>
    </>
  );
};

export default CreatePrototypeForm;
