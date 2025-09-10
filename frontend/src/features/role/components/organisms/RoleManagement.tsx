'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { IoArrowBack } from 'react-icons/io5';

import Loading from '@/components/organisms/Loading';
import { useRoleManagement } from '@/features/role/hooks/useRoleManagement';

import Toast from '../atoms/Toast';
import RoleManagementForm from '../molecules/RoleManagementForm';
import UserRoleTable from '../molecules/UserRoleTable';

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

  const {
    // データ
    userRoles,
    candidateUsers,
    masterPrototypeName,
    creator,
    loading,
    canRemoveUserRole,
    isCurrentUserAdmin,

    // UI状態
    roleForm,
    toast,

    // ハンドラー
    handleAddRole,
    handleRemoveRole,
    updateRole,
    updateRoleForm,
    closeToast,
    fetchAllUsers,
  } = useRoleManagement(projectId);

  // debounce 用の ref
  const searchTimeoutRef = useRef<number | null>(null);

  // searchTerm が変化して0.5秒操作が無ければサーバーに問い合わせる
  useEffect(() => {
    // 以前のタイマーをクリア
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    // 新しいタイマーを設定
    searchTimeoutRef.current = window.setTimeout(() => {
      // username=searchTerm で API を呼び出す
      try {
        fetchAllUsers(searchTerm);
      } catch (e) {
        console.error('RoleManagement: fetchAllUsers failed', e);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, [searchTerm, fetchAllUsers]);

  // 検索結果をフィルタリング
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return candidateUsers;
    return candidateUsers.filter((user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [candidateUsers, searchTerm]);

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

  // 権限追加のハンドラー（ユーザー選択状態もクリア）
  const handleAddRoleWithReset = async () => {
    await handleAddRole();
    // 権限追加成功後にユーザー選択状態をリセット
    setSelectedUser(null);
    setSearchTerm('');
  };

  // ローディング中の表示
  if (loading && userRoles.length === 0) {
    return <Loading />;
  }

  return (
    <div className="max-w-4xl mx-auto py-16 relative px-4">
      <div className="sticky top-20 z-sticky bg-transparent backdrop-blur-sm flex items-center gap-3 mb-8 py-4 rounded-lg">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-kibako-tertiary rounded-full transition-colors"
          title="前のページに戻る"
        >
          <IoArrowBack className="h-5 w-5 text-kibako-primary hover:text-kibako-primary transition-colors" />
        </button>
        <h1 className="text-3xl text-kibako-primary font-bold mb-0">
          権限設定
        </h1>
      </div>

      <div className="mb-6 p-6 overflow-visible rounded-xl bg-gradient-to-r from-kibako-white via-kibako-white to-kibako-tertiary shadow-lg border border-kibako-tertiary/30">
        <div className="flex items-center justify-between mb-4 border-b border-kibako-secondary/30 pb-2">
          <h2 className="text-xl font-bold text-kibako-primary">権限管理</h2>
        </div>
        <div className="space-y-4">
          <p className="text-kibako-primary">
            プロジェクト
            {masterPrototypeName && `「${masterPrototypeName}」の`}
            ユーザー権限を管理します。
          </p>
          {!isCurrentUserAdmin && (
            <p className="text-kibako-primary/70">
              権限を設定できるのはAdminユーザーのみです
            </p>
          )}

          <RoleManagementForm
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
            loading={loading}
            canManageRole={isCurrentUserAdmin}
          />
        </div>
      </div>

      <div className="mb-8 p-6 overflow-visible rounded-xl bg-gradient-to-r from-kibako-white via-kibako-white to-kibako-tertiary shadow-lg border border-kibako-tertiary/30">
        <div className="flex items-center justify-between mb-4 border-b border-kibako-secondary/30 pb-2">
          <h2 className="text-xl font-bold text-kibako-primary">
            現在のユーザー権限
          </h2>
        </div>
        <div
          className={`transition-all overflow-x-auto ${
            !isCurrentUserAdmin ? 'opacity-40 pointer-events-none' : ''
          }`}
        >
          <UserRoleTable
            userRoles={userRoles}
            creator={creator}
            canRemoveUserRole={canRemoveUserRole}
            onRoleChange={(userId, role) => updateRole(userId, role)}
            onRemove={handleRemoveRole}
            loading={loading}
            canManageRole={isCurrentUserAdmin}
          />
        </div>
      </div>

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
