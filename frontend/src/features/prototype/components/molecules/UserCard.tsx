import React from 'react';
import { FaCrown } from 'react-icons/fa';

import { User } from '@/api/types';

/**
 * ユーザーカードコンポーネント
 * ユーザー情報とアクションボタンを表示する
 * オーナーの場合は王冠アイコンを表示して区別する
 */
export const UserCard: React.FC<{
  user: User;
  actionButton: React.ReactNode;
  isOwner?: boolean;
}> = ({ user, actionButton, isOwner = false }) => {
  return (
    <div
      className={`flex items-center justify-between p-3 border-b last:border-b-0 ${isOwner ? 'bg-amber-50' : ''}`}
    >
      <div className="flex items-center gap-2">
        {isOwner && (
          <FaCrown className="text-amber-500 h-4 w-4" title="オーナー" />
        )}
        <span
          className={`${isOwner ? 'font-medium text-wood-darkest' : 'text-wood-darkest'}`}
        >
          {user.username}
        </span>
      </div>
      <div className="flex items-center justify-end min-w-[80px]">
        {actionButton}
      </div>
    </div>
  );
};
