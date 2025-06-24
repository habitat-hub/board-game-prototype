'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { IoArrowBack } from 'react-icons/io5';
import { RiLoaderLine } from 'react-icons/ri';

import { usePrototypeGroup } from '@/api/hooks/usePrototypeGroup';

const CreatePrototypeForm: React.FC = () => {
  const router = useRouter();
  const { createPrototypeGroup } = usePrototypeGroup();

  // フォーム
  const [form, setForm] = useState({
    // プロトタイプ名
    name: '',
    // プレイヤー人数
    playerCount: 4,
  });
  // エラー
  const [error, setError] = useState<string | null>(null);
  // 作成中フラグ
  const [isCreating, setIsCreating] = useState(false);

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
      // 作成中フラグを立てる
      setIsCreating(true);

      // プロトタイプを作成する
      const newPrototype = await createPrototypeGroup({
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
      router.push(`/prototypes/groups/${newPrototype.prototypeGroupId}`);
    } catch (error) {
      console.error('Error creating prototype:', error);
      setError('エラーが発生しました。');
      // 作成中フラグを戻す
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 relative">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/prototypes"
          className="p-2 hover:bg-content-secondary rounded-full transition-colors"
          title="プロトタイプ一覧へ戻る"
        >
          <IoArrowBack className="h-5 w-5 text-wood-dark hover:text-header transition-colors" />
        </Link>
        <h1 className="text-4xl font-bold text-center flex-grow bg-gradient-to-r from-header via-header-light to-header text-transparent bg-clip-text">
          プロトタイプ作成
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-gradient-to-br from-content to-content-secondary rounded-2xl shadow-lg border border-wood-lightest/30 p-6"
      >
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <div className="mb-4">
          <label
            htmlFor="prototypeName"
            className="block text-wood-darkest mb-2 font-medium"
          >
            プロトタイプ名
          </label>
          <input
            id="prototypeName"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="プロトタイプ名"
            className="w-full p-2 border bg-white rounded-lg text-wood-darkest shadow-inner border-wood-lightest/40"
            required
            disabled={isCreating}
          />
        </div>
        <div className="mb-6">
          <label
            htmlFor="playerCount"
            className="block text-wood-darkest mb-2 font-medium"
          >
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
            className="w-full p-2 border bg-white rounded-lg text-wood-darkest shadow-inner border-wood-lightest/40"
            required
            disabled={isCreating}
          />
        </div>
        <button
          type="submit"
          disabled={isCreating}
          className={`w-full bg-gradient-to-r from-header/90 to-header-light/90 text-white p-3 rounded-xl border border-header/20 font-medium transition-all duration-300 transform 
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
            <span>{isCreating ? '作成中...' : '作成'}</span>
          </div>
        </button>
      </form>
    </div>
  );
};

export default CreatePrototypeForm;
