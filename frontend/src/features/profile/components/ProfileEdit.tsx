'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { FaCheck, FaPenToSquare } from 'react-icons/fa6';
import { IoArrowBack } from 'react-icons/io5';

import { useUsers } from '@/api/hooks/useUsers';
import KibakoButton from '@/components/atoms/KibakoButton';
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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

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
  const handleUpdateUsername = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    // 二重送信防止
    if (isSubmitting) return;

    // ユーザー名未入力の場合
    if (!username.trim()) {
      setError('ユーザー名を入力してください');
      setSuccess('');
      return;
    }

    // ユーザー情報未取得の場合
    if (!user?.id) {
      setError('ユーザー情報が取得できませんでした');
      setSuccess('');
      return;
    }

    // 変更なしの場合
    if (username.trim() === user?.username?.trim()) {
      setError('');
      setSuccess('');
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedUser = await updateUser(user.id, {
        username: username.trim(),
      });

      // ユーザーコンテキストを更新
      setUser(updatedUser);

      // 更新成功メッセージを表示
      setSuccess('ユーザー名を更新しました');
      setError('');
      // 編集モードを終了
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating username:', error);
      setError('ユーザー名の更新に失敗しました');
      // エラー時は元のユーザー名に戻す
      if (user?.username) setUsername(user.username);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ページ読み込み中のスケルトン表示
  if (isPageLoading) {
    return <ProfileEditSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto py-16 relative px-4">
      <div className="sticky top-20 z-sticky bg-transparent backdrop-blur-sm flex items-center gap-3 mb-8 py-4 rounded-lg">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-kibako-tertiary rounded-full transition-colors"
          title="前のページに戻る"
        >
          <IoArrowBack className="h-5 w-5 text-kibako-primary hover:text-kibako-primary transition-colors" />
        </button>
        <h1 className="text-3xl text-kibako-primary font-bold mb-0">
          プロフィール編集
        </h1>
      </div>

      <div className="mb-6 p-6 overflow-visible rounded-xl bg-gradient-to-r from-kibako-white via-kibako-white to-kibako-tertiary shadow-lg border border-kibako-tertiary/30">
        <div className="flex items-center justify-between mb-4 border-b border-kibako-secondary/30 pb-2">
          <h2 className="text-xl font-bold text-kibako-primary">ユーザー情報</h2>
          {!isEditing && (
            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
                setError('');
                setSuccess('');
                setUsername(user?.username || '');
              }}
              className="p-2 hover:bg-kibako-tertiary rounded-full transition-colors"
              title="編集"
            >
              <FaPenToSquare className="h-5 w-5 text-kibako-primary" />
            </button>
          )}
        </div>

        {!isEditing ? (
          // 表示モード
          <div className="space-y-4">
            <div>
              <p className="block text-sm uppercase tracking-wide text-kibako-primary/70 mb-1 font-medium">
                ユーザー名
              </p>
              <p className="text-kibako-primary text-base font-semibold break-words">
                {user?.username || '-'}
              </p>
            </div>
            {success && (
              <p role="status" aria-live="polite" className="text-kibako-success text-xs">
                {success}
              </p>
            )}
            {error && (
              <p role="alert" aria-live="assertive" className="text-kibako-danger text-xs">
                {error}
              </p>
            )}
          </div>
        ) : (
          // 編集モード
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
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-wrap justify-end items-center gap-2">
              {error && (
                <p
                  role="alert"
                  aria-live="assertive"
                  className="text-kibako-danger text-xs"
                >
                  {error}
                </p>
              )}
              {success && (
                <p
                  role="status"
                  aria-live="polite"
                  className="text-kibako-success text-xs"
                >
                  {success}
                </p>
              )}
              <KibakoButton
                type="submit"
                size="md"
                className="flex items-center gap-2"
                disabled={isSubmitting}
              >
                <FaCheck className="w-4 h-4" />
                更新する
              </KibakoButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfileEdit;
