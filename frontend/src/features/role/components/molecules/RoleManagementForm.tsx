import React from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';

import RoleSelector from './RoleSelector';
import UserSearchDropdown from './UserSearchDropdown';

interface User {
  id: string;
  username: string;
}

interface RoleManagementFormProps {
  // 編集モード
  editMode: {
    isEditing: boolean;
    userId: string | null;
    username: string | null;
    currentRole: string | null;
  };
  onCancelEdit: () => void;

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
  onUpdateRole: () => void;
  loading: boolean;
}

const RoleManagementForm: React.FC<RoleManagementFormProps> = ({
  editMode,
  onCancelEdit,
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
  onUpdateRole,
  loading,
}) => {
  return (
    <div className="mb-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        {/* ヘッダー */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            {editMode.isEditing ? (
              <>
                <h3 className="text-lg font-medium text-kibako-primary">
                  {editMode.username} の権限を変更
                </h3>
                <button
                  onClick={onCancelEdit}
                  className="ml-auto p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                  title="編集をキャンセル"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              </>
            ) : (
              <h3 className="text-lg font-medium text-kibako-primary">
                新しいユーザーを追加
              </h3>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {/* ユーザー検索（編集モード時は非表示） */}
          {!editMode.isEditing && (
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
          )}

          {/* 権限選択 */}
          <RoleSelector
            selectedRole={selectedRole}
            onRoleChange={onRoleChange}
            loading={loading}
          />

          {/* 追加・更新ボタン（中央下） */}
          <div className="flex justify-center pt-1">
            {editMode.isEditing ? (
              <div className="flex gap-3">
                <button
                  onClick={onCancelEdit}
                  disabled={loading}
                  className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span className="text-sm">キャンセル</span>
                </button>
                <button
                  onClick={onUpdateRole}
                  disabled={loading}
                  className="px-6 py-2 bg-kibako-secondary hover:bg-kibako-primary text-kibako-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-kibako-white"></div>
                      <span className="text-sm">更新中...</span>
                    </>
                  ) : (
                    <span className="text-sm">権限を更新</span>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={onAddRole}
                disabled={!selectedUser || loading}
                className="px-6 py-2 bg-kibako-secondary hover:bg-kibako-primary text-kibako-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagementForm;
