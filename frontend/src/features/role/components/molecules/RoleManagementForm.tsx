import React from 'react';
import { FaPlus } from 'react-icons/fa';

import RoleSelect from '@/features/role/components/atoms/RoleSelect';

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

        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          {/* ユーザー検索 */}
          <div className="flex-1 min-w-0">
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
          </div>

          {/* 権限選択 */}
          <div className="md:w-48 w-full">
            <label className="block text-sm font-medium text-kibako-primary mb-1">
              権限
            </label>
            <RoleSelect
              value={selectedRole}
              onChange={onRoleChange}
              disabled={loading || !canManageRole}
              title={
                !canManageRole
                  ? '権限変更する権限がありません'
                  : '付与する権限を選択'
              }
              className="w-full"
            />
          </div>

          {/* 追加ボタン */}
          <div className="md:w-auto w-full">
            <label className="block text-sm font-medium text-transparent mb-1 select-none">
              追加
            </label>
            <button
              type="button"
              onClick={onAddRole}
              disabled={!selectedUser || loading || !canManageRole}
              className="w-full md:w-auto px-6 py-2 bg-kibako-secondary hover:bg-kibako-secondary text-kibako-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
