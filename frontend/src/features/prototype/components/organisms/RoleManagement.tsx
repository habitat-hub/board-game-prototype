'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useState } from 'react';
import {
  FaUserShield,
  FaEdit,
  FaPlus,
  FaTrash,
  FaInfoCircle,
} from 'react-icons/fa';
import { IoArrowBack } from 'react-icons/io5';

import { useRoleManagement } from '@/features/prototype/hooks/useRoleManagement';

const RoleManagement: React.FC = () => {
  const router = useRouter();
  const { groupId } = useParams<{ groupId: string }>();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'editor'>(
    'editor'
  );

  const {
    userRoles,
    availableUsers,
    masterPrototypeName,
    loading,
    addRole,
    removeRole,
    canRemoveUserRole,
  } = useRoleManagement(groupId);

  const handleAddRole = async () => {
    if (selectedUserId && selectedRole) {
      await addRole(selectedUserId, selectedRole);
      setShowAddModal(false);
      setSelectedUserId(null);
      setSelectedRole('editor');
    }
  };

  const handleRemoveRole = async (userId: string) => {
    const removeCheck = canRemoveUserRole(userId, userRoles);

    if (!removeCheck.canRemove) {
      alert(removeCheck.reason);
      return;
    }

    if (confirm('このユーザーのロールを削除しますか？')) {
      await removeRole(userId);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow mt-16">
      <div className="flex items-center relative mb-6">
        <button
          onClick={() => router.push(`/groups/${groupId}`)}
          className="p-2 hover:bg-content-secondary rounded-full transition-colors absolute left-0"
          title="プロトタイプ管理へ戻る"
        >
          <IoArrowBack className="h-5 w-5 text-wood-dark hover:text-header transition-colors" />
        </button>
        <h2 className="text-xl font-bold w-full text-center">ロール管理</h2>
      </div>

      <div className="mb-6">
        <p className="text-center text-wood-dark">
          {masterPrototypeName && `「${masterPrototypeName}」の`}
          ユーザーロールを管理します。
        </p>
      </div>

      {/* 現在のユーザーロール一覧 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-wood-dark">
            現在のユーザーロール
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-wood-light hover:bg-wood text-white rounded-lg transition-colors disabled:opacity-50"
            disabled={loading}
          >
            <FaPlus className="h-4 w-4" />
            ロール追加
          </button>
        </div>

        <div className="space-y-2">
          {userRoles.map((userRole) => {
            const removeCheck = canRemoveUserRole(userRole.userId, userRoles);

            return (
              <div
                key={userRole.userId}
                className="flex items-center justify-between p-4 bg-content border border-wood-lightest/20 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {userRole.roles.some((role) => role.name === 'admin') ? (
                    <FaUserShield className="h-5 w-5 text-red-600" />
                  ) : (
                    <FaEdit className="h-5 w-5 text-blue-600" />
                  )}
                  <div>
                    <div className="font-medium text-wood-dark">
                      {userRole.user.username}
                    </div>
                    <div className="text-sm text-wood">
                      {userRole.roles.map((role) => role.name).join(', ')}
                    </div>
                    {!removeCheck.canRemove && (
                      <div className="text-xs text-orange-600 mt-1">
                        {removeCheck.reason}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveRole(userRole.userId)}
                  className={`p-2 rounded-md transition-colors ${
                    removeCheck.canRemove
                      ? 'text-wood hover:text-red-500 hover:bg-wood-lightest/20'
                      : 'text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                  title={
                    removeCheck.canRemove ? 'ロールを削除' : removeCheck.reason
                  }
                  disabled={loading || !removeCheck.canRemove}
                >
                  <FaTrash className="h-4 w-4" />
                </button>
              </div>
            );
          })}
          {userRoles.length === 0 && (
            <div className="text-center py-8 text-wood">
              まだユーザーロールが設定されていません
            </div>
          )}
        </div>
      </div>

      {/* ロール詳細へのリンク */}
      <div className="text-center">
        <button
          onClick={() => router.push(`/groups/${groupId}/roles/details`)}
          className="inline-flex items-center gap-2 px-4 py-2 text-wood-dark bg-content hover:bg-wood-lightest border border-wood-lightest rounded-lg transition-colors"
        >
          <FaInfoCircle className="h-4 w-4" />
          ロールの詳細と権限を確認
        </button>
      </div>

      {/* ロール追加モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">ロール追加</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-wood-dark mb-2">
                ユーザー選択
              </label>
              <select
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full p-2 border border-wood-lightest rounded-md focus:outline-none focus:ring-2 focus:ring-wood-light"
              >
                <option value="">ユーザーを選択してください</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-wood-dark mb-2">
                ロール選択
              </label>
              <select
                value={selectedRole}
                onChange={(e) =>
                  setSelectedRole(e.target.value as 'admin' | 'editor')
                }
                className="w-full p-2 border border-wood-lightest rounded-md focus:outline-none focus:ring-2 focus:ring-wood-light"
              >
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 text-wood-dark bg-content hover:bg-wood-lightest border border-wood-lightest rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddRole}
                disabled={!selectedUserId || loading}
                className="flex-1 px-4 py-2 bg-wood-light hover:bg-wood text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '追加中...' : '追加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
