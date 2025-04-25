'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { usePrototypes } from '@/api/hooks/usePrototypes';

const CreatePrototypeForm: React.FC = () => {
  const router = useRouter();
  const { createPrototype } = usePrototypes();

  // フォーム
  const [form, setForm] = useState({
    // プロトタイプ名
    name: '',
    // プレイヤー人数
    playerCount: 4,
  });
  // エラー
  const [error, setError] = useState<string | null>(null);

  /**
   * プロトタイプを作成する
   * @param event - イベント
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // プロトタイプ名またはプレイヤー人数を入力していない場合
    if (!form.name || form.playerCount <= 0) {
      setError('プロトタイプ名とプレイヤー人数を入力してください。');
      return;
    }

    try {
      // プロトタイプを作成する
      const newPrototype = await createPrototype({
        name: form.name,
        playerCount: form.playerCount,
      });

      // フォームをリセットする
      setForm({
        name: '',
        playerCount: 4,
      });
      setError(null);

      // グループページへ遷移する
      router.push(`/prototypes/groups/${newPrototype.groupId}`);
    } catch (error) {
      console.error('Error creating prototype:', error);
      setError('エラーが発生しました。');
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto mt-10 p-4 shadow-md rounded-lg bg-content-secondary relative"
      >
        <h2 className="text-xl font-bold mb-4 text-center">
          新しいプロトタイプを作成
        </h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <div className="mb-4">
          <label
            htmlFor="prototypeName"
            className="block text-wood-darkest mb-2"
          >
            プロトタイプ名
          </label>
          <input
            id="prototypeName"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="プロトタイプ名"
            className="w-full p-2 border bg-content rounded text-wood-darkest"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="playerCount" className="block text-wood-darkest mb-2">
            プレイヤー人数
          </label>
          <input
            id="playerCount"
            type="number"
            value={form.playerCount}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value >= 0) {
                setForm({ ...form, playerCount: value });
              }
            }}
            placeholder="プレイヤー人数"
            className="w-full p-2 border bg-content rounded text-wood-darkest"
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
