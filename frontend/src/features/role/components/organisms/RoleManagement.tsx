'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useState, useMemo } from 'react';
import { IoArrowBack } from 'react-icons/io5';

import { useRoleManagement } from '@/features/role/hooks/useRoleManagement';

import Toast from '../atoms/Toast';
import ConfirmDialog from '../molecules/ConfirmDialog';
import RoleManagementForm from '../molecules/RoleManagementForm';
import UserRolesList from '../molecules/UserRolesList';

const RoleManagement: React.FC = () => {
  const router = useRouter();
  const { projectId } = useParams<{ projectId: string }>();

  // ユーザー検索用の状態
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    username: string;
  } | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // 編集モード用の状態
  const [editMode, setEditMode] = useState<{
    isEditing: boolean;
    userId: string | null;
    username: string | null;
    currentRole: string | null;
  }>({
    isEditing: false,
    userId: null,
    username: null,
    currentRole: null,
  });

  const {
    // データ
    userRoles,
    availableUsers,
    masterPrototypeName,
    creator,
    loading,
    canRemoveUserRole,

    // UI状態
    roleForm,
    toast,
    confirmDialog,

    // ハンドラー
    handleAddRole,
    handleUpdateRole,
    handleRemoveRole,
    handleConfirmRemove,
    handleCancelRemove,
    updateRoleForm,
    closeToast,
  } = useRoleManagement(projectId);

  // 検索結果をフィルタリング
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return availableUsers;
    return availableUsers.filter((user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableUsers, searchTerm]);

  // ユーザー選択ハンドラー
  const handleUserSelect = (user: { id: string; username: string }) => {
    setSelectedUser(user);
    setShowUserDropdown(false);
    setSearchTerm('');
    updateRoleForm({ selectedUserId: user.id });
  };

  // ユーザー選択をクリア
  const handleClearUser = () => {
    setSelectedUser(null);
    setSearchTerm('');
    updateRoleForm({ selectedUserId: '' });
  };

  // 編集モード開始
  const handleStartEdit = (
    userId: string,
    username: string,
    currentRole: string
  ) => {
    setEditMode({
      isEditing: true,
      userId,
      username,
      currentRole,
    });
    updateRoleForm({
      selectedUserId: userId,
      selectedRole: currentRole as 'admin' | 'editor' | 'viewer',
    });
  };

  // 編集モードキャンセル
  const handleCancelEdit = () => {
    setEditMode({
      isEditing: false,
      userId: null,
      username: null,
      currentRole: null,
    });
    setSelectedUser(null);
    setSearchTerm('');
    updateRoleForm({ selectedUserId: '', selectedRole: 'admin' });
  };

  // 権限更新実行
  const handleUpdateRoleWithReset = async () => {
    if (editMode.userId && roleForm.selectedRole) {
      await handleUpdateRole(editMode.userId, roleForm.selectedRole);
      // 更新成功後に編集モードをリセット
      handleCancelEdit();
    }
  };

  // 権限追加のハンドラー（ユーザー選択状態もクリア）
  const handleAddRoleWithReset = async () => {
    await handleAddRole();
    // 権限追加成功後にユーザー選択状態をリセット
    setSelectedUser(null);
    setSearchTerm('');
  };

  // ローディング中の表示
  if (loading && userRoles.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow mt-16">
        <div className="flex items-center relative mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors absolute left-0"
            title="戻る"
          >
            <IoArrowBack className="h-5 w-5 text-wood-dark hover:text-header transition-colors" />
          </button>
          <h2 className="text-xl font-bold w-full text-center">権限設定</h2>
        </div>

        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wood-light"></div>
          <span className="ml-3 text-wood-dark">権限情報を読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow mt-16">
      <div className="flex items-center relative mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors absolute left-0"
          title="戻る"
        >
          <IoArrowBack className="h-5 w-5 text-wood-dark hover:text-header transition-colors" />
        </button>
        <h2 className="text-xl font-bold w-full text-center">権限設定</h2>
      </div>

      <div className="mb-6">
        <p className="text-center text-wood-dark">
          プロトタイプ
          {masterPrototypeName && `「${masterPrototypeName}」の`}
          ユーザー権限を管理します。
        </p>
      </div>

      {/* ユーザー権限管理 */}
      <div className="mb-8">
        {/* 権限追加・更新フォーム */}
        <RoleManagementForm
          editMode={editMode}
          onCancelEdit={handleCancelEdit}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          selectedUser={selectedUser}
          onUserSelect={handleUserSelect}
          onClearUser={handleClearUser}
          showUserDropdown={showUserDropdown}
          onToggleUserDropdown={setShowUserDropdown}
          filteredUsers={filteredUsers}
          selectedRole={roleForm.selectedRole}
          onRoleChange={(role) => updateRoleForm({ selectedRole: role })}
          onAddRole={handleAddRoleWithReset}
          onUpdateRole={handleUpdateRoleWithReset}
          loading={loading}
        />

        {/* 現在のユーザー権限一覧 */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-all ${
            editMode.isEditing ? 'opacity-40 pointer-events-none' : ''
          }`}
        >
          <UserRolesList
            userRoles={userRoles}
            creator={creator}
            canRemoveUserRole={canRemoveUserRole}
            onEdit={handleStartEdit}
            onRemove={handleRemoveRole}
            loading={loading}
            editMode={editMode.isEditing}
          />
        </div>
      </div>

      {/* 確認ダイアログ */}
      <ConfirmDialog
        show={confirmDialog.show && !!confirmDialog.data}
        title="権限削除の確認"
        message={
          confirmDialog.data
            ? `${confirmDialog.data.userName} の権限を削除しますか？`
            : ''
        }
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
      />

      {/* トーストメッセージ */}
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={closeToast}
      />
    </div>
  );
};

export default RoleManagement;
