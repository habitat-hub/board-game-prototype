import React from 'react';
import { FaSearch, FaUser, FaTimes } from 'react-icons/fa';

import { User } from '@/__generated__/api/client';

import UserAvatar from '../atoms/UserAvatar';

type UserSearchUser = Pick<User, 'id' | 'username'>;

interface UserSearchDropdownProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedUser: UserSearchUser | null;
  onUserSelect: (user: UserSearchUser) => void;
  onClearUser: () => void;
  showDropdown: boolean;
  onToggleDropdown: (show: boolean) => void;
  filteredUsers: UserSearchUser[];
  loading?: boolean;
}

const UserSearchDropdown: React.FC<UserSearchDropdownProps> = ({
  searchTerm,
  onSearchChange,
  selectedUser,
  onUserSelect,
  onClearUser,
  showDropdown,
  onToggleDropdown,
  filteredUsers,
  loading = false,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-kibako-primary mb-1">
        ユーザー検索
      </label>
      <div className="relative">
        {/* 選択されたユーザー表示 */}
        {selectedUser ? (
          <div className="w-full p-2 border border-kibako-secondary/30 rounded-md bg-kibako-white focus:outline-none focus:ring-2 focus:ring-kibako-secondary flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserAvatar username={selectedUser.username} size="sm" />
              <div>
                <div className="text-sm font-medium text-kibako-primary">
                  {selectedUser.username}
                </div>
              </div>
            </div>
            <button
              onClick={onClearUser}
              disabled={loading}
              className="p-1 text-kibako-primary/60 hover:text-kibako-danger hover:bg-kibako-danger/10 rounded transition-colors"
              title="選択を解除"
            >
              <FaTimes className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <>
            {/* 検索入力 */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  onToggleDropdown(true);
                }}
                onFocus={() => onToggleDropdown(true)}
                placeholder="ユーザー名を入力..."
                className="w-full p-2 pl-8 text-sm border border-kibako-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-kibako-secondary focus:border-transparent"
                disabled={loading}
              />
              <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-kibako-primary/60 h-3 w-3" />
            </div>

            {/* 検索結果ドロップダウン */}
            {showDropdown && (
              <>
                {/* 背景オーバーレイ */}
                <div
                  className="fixed inset-0 z-sticky"
                  onClick={() => onToggleDropdown(false)}
                />

                {/* ドロップダウンメニュー */}
                <div className="absolute top-full left-0 right-0 mt-1 bg-kibako-white border border-kibako-secondary/20 rounded-md shadow-lg z-dropdown max-h-48 overflow-auto">
                  {filteredUsers.length > 0 ? (
                    <div className="py-1">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => onUserSelect(user)}
                          className="w-full px-3 py-2 text-left hover:bg-kibako-tertiary/20 transition-colors flex items-center gap-2 group"
                        >
                          <UserAvatar
                            username={user.username}
                            size="sm"
                            className="group-hover:shadow-md transition-shadow"
                          />
                          <div className="text-sm font-medium text-kibako-primary">
                            {user.username}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-4 text-center text-kibako-secondary">
                      <FaUser className="h-6 w-6 text-kibako-secondary/50 mx-auto mb-1" />
                      <div className="text-xs">
                        {searchTerm
                          ? `"${searchTerm}" に一致するユーザーが見つかりません`
                          : 'ユーザーが見つかりません'}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserSearchDropdown;
