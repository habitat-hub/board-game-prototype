import React from 'react';

import { User } from '@/api/types';

/**
 * ユーザーカードコンポーネント
 * ユーザー情報とアクションボタンを表示する
 */
export const UserCard: React.FC<{
  user: User;
  actionButton: React.ReactNode;
}> = ({ user, actionButton }) => {
  return (
    <div className="flex items-center justify-between p-3 border-b last:border-b-0">
      <span className="text-wood-darkest">{user.username}</span>
      <div className="flex items-center justify-center w-10 h-10">
        {actionButton}
      </div>
    </div>
  );
};
