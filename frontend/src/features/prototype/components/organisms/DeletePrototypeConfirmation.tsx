'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IoArrowBack, IoTrash } from 'react-icons/io5';

import { usePrototypes } from '@/api/hooks/usePrototypes';
import { Prototype } from '@/api/types';
import { useUser } from '@/hooks/useUser';

const DeletePrototypeConfirmation = () => {
  const router = useRouter();
  const { user } = useUser();
  const { prototypeId } = useParams<{ prototypeId: string }>();
  const { getPrototype, deletePrototype } = usePrototypes();
  const [prototype, setPrototype] = useState<Prototype | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrototype = async () => {
      try {
        setIsLoading(true);
        const prototype = await getPrototype(prototypeId);
        setPrototype(prototype);

        // ユーザーがプロトタイプのオーナーでない場合はリダイレクト
        if (user && prototype.userId !== user.id) {
          router.push('/prototypes');
        }
      } catch (err) {
        setError('プロトタイプの取得に失敗しました');
        console.error('Error fetching prototype:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchPrototype();
    }
  }, [prototypeId, getPrototype, user, router]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deletePrototype(prototypeId);
      router.push('/prototypes');
    } catch (err) {
      setError('プロトタイプの削除に失敗しました');
      console.error('Error deleting prototype:', err);
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto mt-16 p-8 bg-white rounded-xl shadow-lg">
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/2"></div>
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-24 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-16 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
        >
          戻る
        </button>
      </div>
    );
  }

  if (!prototype) {
    return (
      <div className="max-w-3xl mx-auto mt-16 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center text-gray-600">
          プロトタイプが見つかりません
        </div>
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/prototypes')}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            プロトタイプ一覧へ戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-16 p-8 bg-white rounded-xl shadow-lg">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="戻る"
        >
          <IoArrowBack className="h-5 w-5 text-wood-dark hover:text-header transition-colors" />
        </button>
      </div>

      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-red-600 mb-2">
          プロトタイプを削除
        </h1>
        <div className="bg-red-50 rounded-lg p-4 text-red-800 mb-6">
          <p className="mb-2">
            <span className="font-bold">警告:</span> 削除操作は取り消せません。
          </p>
          <p>
            このプロトタイプの全てのバージョン、プレイルーム、関連するデータが完全に削除されます。
          </p>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">削除するプロトタイプ</h2>
        <div className="mb-4">
          <div className="text-sm text-gray-500">プロトタイプ名</div>
          <div className="text-lg font-medium">{prototype.name}</div>
        </div>
        <div className="mb-4">
          <div className="text-sm text-gray-500">プレイヤー人数</div>
          <div>
            {prototype.minPlayers === prototype.maxPlayers
              ? `${prototype.minPlayers}人`
              : `${prototype.minPlayers}〜${prototype.maxPlayers}人`}
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="flex-1 py-3 px-6 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          disabled={isDeleting}
        >
          キャンセル
        </button>
        <button
          onClick={handleDelete}
          className="flex-1 py-3 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              削除中...
            </>
          ) : (
            <>
              <IoTrash className="w-5 h-5" />
              削除する
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DeletePrototypeConfirmation;
