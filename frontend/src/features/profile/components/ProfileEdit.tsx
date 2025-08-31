'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { FaCheck } from 'react-icons/fa6';
import { IoArrowBack } from 'react-icons/io5';

import { useUsers } from '@/api/hooks/useUsers';
import { useUser } from '@/hooks/useUser';

import ProfileEditSkeleton from './ProfileEditSkeleton';

const ProfileEdit: React.FC = () => {
  const router = useRouter();
  const { user, setUser } = useUser();
  const { updateUser } = useUsers();

  const [username, setUsername] = useState(user?.username || '');
  const [isPageLoading, setIsPageLoading] = useState(true); // ページ読み込み時のローディング状態
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ユーザー情報が変更されたときに入力フィールドを更新
  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
      setIsPageLoading(false); // ユーザー情報が読み込まれたらローディング状態を解除
    }
  }, [user]);

  // 成功メッセージが表示されたら数秒後に自動的に消す
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000); // 3秒後に成功メッセージをクリア

      return () => clearTimeout(timer);
    }
  }, [success]);

  // 前のページに戻る処理
  const handleBack = () => {
    router.back();
  };

  // ユーザー名更新処理
  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError('ユーザー名を入力してください');
      setSuccess('');
      return;
    }

    if (!user?.id) {
      setError('ユーザー情報が取得できませんでした');
      setSuccess('');
      return;
    }

    // ユーザー名が変わっていない場合は処理を終了
    if (username.trim() === user?.username?.trim()) {
      setError('');
      setSuccess('');
      return;
    }

    try {
      const updatedUser = await updateUser(user.id, {
        username: username.trim(),
      });

      // ユーザーコンテキストを更新
      setUser(updatedUser);

      // 更新成功メッセージを表示
      setSuccess('ユーザー名を更新しました');
      setError('');
    } catch (error) {
      console.error('Error updating username:', error);
      setError('ユーザー名の更新に失敗しました');
      // エラー時は元のユーザー名に戻す
      if (user?.username) {
        setUsername(user.username);
      }
    }
  };

  // ページ読み込み中のスケルトン表示
  if (isPageLoading) {
    return <ProfileEditSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto mt-16 relative">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-kibako-tertiary rounded-full transition-colors"
          title="前のページに戻る"
        >
          <IoArrowBack className="h-5 w-5 text-kibako-primary hover:text-kibako-accent transition-colors" />
        </button>
        <div className="flex-grow flex items-center justify-center">
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-kibako-primary via-kibako-secondary to-kibako-primary text-transparent bg-clip-text">
            プロフィール編集
          </h1>
        </div>
      </div>

      <div className="mb-6 p-6 overflow-visible rounded-xl bg-gradient-to-r from-kibako-tertiary via-kibako-tertiary to-kibako-white shadow-lg border border-kibako-tertiary/30">
        <h2 className="text-xl font-bold text-kibako-primary mb-4 border-b border-kibako-secondary/30 pb-2">
          ユーザー情報
        </h2>

        <form onSubmit={handleUpdateUsername} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm uppercase tracking-wide text-kibako-primary/70 mb-2 font-medium"
            >
              ユーザー名
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ユーザー名を入力"
              className="py-2 px-3 border border-kibako-secondary/30 rounded-lg bg-kibako-white w-full"
              maxLength={50}
              autoFocus
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1 px-4 py-2 rounded-md bg-kibako-secondary hover:bg-kibako-primary text-kibako-white hover:shadow-md transition-all font-medium"
            >
              <FaCheck className="w-4 h-4" />
              更新する
            </button>
          </div>
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded-md border border-red-100">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-600 text-sm bg-green-50 p-2 rounded-md border border-green-100">
              {success}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProfileEdit;
