import React from 'react';
import { FaPlus } from 'react-icons/fa';

import RoleSelector from './RoleSelector';
import UserSearchDropdown from './UserSearchDropdown';

interface User {
  id: string;
  username: string;
}

interface RoleManagementFormProps {
  // ユーザー検索
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedUser: User | null;
  onUserSelect: (user: User) => void;
  onClearUser: () => void;
  showUserDropdown: boolean;
  onToggleUserDropdown: (show: boolean) => void;
  filteredUsers: User[];

  // ロール選択
  selectedRole: 'admin' | 'editor' | 'viewer';
  onRoleChange: (role: 'admin' | 'editor' | 'viewer') => void;

  // アクション
  onAddRole: () => void;
  loading: boolean;
  canManageRole: boolean;
}

const RoleManagementForm: React.FC<RoleManagementFormProps> = ({
  searchTerm,
  onSearchTermChange,
  selectedUser,
  onUserSelect,
  onClearUser,
  showUserDropdown,
  onToggleUserDropdown,
  filteredUsers,
  selectedRole,
  onRoleChange,
  onAddRole,
  loading,
  canManageRole,
}) => {
  return (
    <div className="mb-4">
      <div
        className={`bg-kibako-tertiary/20 border border-kibako-secondary/20 rounded-lg p-3 ${
          canManageRole ? '' : 'opacity-50 pointer-events-none'
        }`}
      >
        {/* ヘッダー */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-kibako-primary">
              新しいユーザーを追加
            </h3>
          </div>
        </div>

        <div className="space-y-3">
          {/* ユーザー検索 */}
          <UserSearchDropdown
            searchTerm={searchTerm}
            onSearchChange={onSearchTermChange}
            selectedUser={selectedUser}
            onUserSelect={onUserSelect}
            onClearUser={onClearUser}
            showDropdown={showUserDropdown}
            onToggleDropdown={onToggleUserDropdown}
            filteredUsers={filteredUsers}
            loading={loading}
          />

          {/* 権限選択 */}
          <RoleSelector
            selectedRole={selectedRole}
            onRoleChange={onRoleChange}
            loading={loading}
          />

          {/* 追加ボタン（中央下） */}
          <div className="flex justify-center pt-1">
            <button
              onClick={onAddRole}
              disabled={!selectedUser || loading || !canManageRole}
              className="px-6 py-2 bg-kibako-secondary hover:bg-kibako-secondary text-kibako-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-kibako-white"></div>
                  <span className="text-sm">追加中...</span>
                </>
              ) : (
                <>
                  <FaPlus className="h-3 w-3" />
                  <span className="text-sm">追加</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagementForm;
