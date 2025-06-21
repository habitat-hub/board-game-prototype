'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useState, useMemo } from 'react';
import {
  FaUserShield,
  FaEdit,
  FaPlus,
  FaTrash,
  FaEye,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
  FaSearch,
  FaUser,
  FaTimes,
} from 'react-icons/fa';
import { IoArrowBack, IoClose } from 'react-icons/io5';

import { useRoleManagement } from '@/features/prototype/hooks/useRoleManagement';

const RoleManagement: React.FC = () => {
  const router = useRouter();
  const { groupId } = useParams<{ groupId: string }>();

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
    handleRemoveRole,
    handleConfirmRemove,
    handleCancelRemove,
    updateRoleForm,
    closeToast,
  } = useRoleManagement(groupId);

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
            onClick={() => router.push(`/groups/${groupId}`)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors absolute left-0"
            title="プロトタイプ管理へ戻る"
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
          onClick={() => router.push(`/groups/${groupId}`)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors absolute left-0"
          title="プロトタイプ管理へ戻る"
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
        {/* 権限追加フォーム */}
        <div className="mb-4">
          {/* フォーム内容 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            {/* ヘッダー */}
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <FaPlus className="h-4 w-4 text-wood-dark" />
                <h3 className="text-lg font-medium text-wood-dark">
                  新しいユーザーを追加
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {/* ユーザー検索 */}
              <div>
                <label className="block text-sm font-medium text-wood-dark mb-1">
                  ユーザー検索
                </label>
                <div className="relative">
                  {/* 選択されたユーザー表示 */}
                  {selectedUser ? (
                    <div className="w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-wood-light flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* ユーザーアバター */}
                        <div className="w-6 h-6 bg-gradient-to-br from-wood-light to-wood rounded-full flex items-center justify-center text-white font-medium text-xs">
                          {selectedUser.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-wood-dark">
                            {selectedUser.username}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleClearUser}
                        disabled={loading}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
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
                            setSearchTerm(e.target.value);
                            setShowUserDropdown(true);
                          }}
                          onFocus={() => setShowUserDropdown(true)}
                          placeholder="ユーザー名を入力..."
                          className="w-full p-2 pl-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wood-light focus:border-transparent"
                          disabled={loading}
                        />
                        <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                      </div>

                      {/* 検索結果ドロップダウン */}
                      {showUserDropdown && (
                        <>
                          {/* 背景オーバーレイ */}
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowUserDropdown(false)}
                          />

                          {/* ドロップダウンメニュー */}
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-48 overflow-auto">
                            {filteredUsers.length > 0 ? (
                              <div className="py-1">
                                {filteredUsers.map((user) => (
                                  <button
                                    key={user.id}
                                    onClick={() => handleUserSelect(user)}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 group"
                                  >
                                    {/* ユーザーアバター */}
                                    <div className="w-6 h-6 bg-gradient-to-br from-wood-light to-wood rounded-full flex items-center justify-center text-white font-medium text-xs group-hover:shadow-md transition-shadow">
                                      {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="text-sm font-medium text-wood-dark">
                                      {user.username}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="px-3 py-4 text-center text-wood">
                                <FaUser className="h-6 w-6 text-gray-300 mx-auto mb-1" />
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

              {/* 権限選択 */}
              <div>
                <label className="block text-sm font-medium text-wood-dark mb-1">
                  権限選択
                </label>
                <div className="flex gap-3">
                  {[
                    {
                      value: 'viewer',
                      name: 'Viewer',
                      icon: <FaEye className="h-6 w-6" />,
                      color: 'text-gray-600',
                      description: 'プロトタイプの閲覧・表示のみ可能',
                      detailDescription:
                        'ゲーム画面の確認、共有リンク表示などの閲覧機能',
                    },
                    {
                      value: 'editor',
                      name: 'Editor',
                      icon: <FaEdit className="h-6 w-6" />,
                      color: 'text-blue-600',
                      description: 'プロトタイプの編集・修正が可能',
                      detailDescription:
                        'コンポーネント追加・削除、設定変更、デザイン調整',
                    },
                    {
                      value: 'admin',
                      name: 'Admin',
                      icon: <FaUserShield className="h-6 w-6" />,
                      color: 'text-red-600',
                      description: '全ての管理権限を持つ最高権限',
                      detailDescription:
                        'プロトタイプ削除、ユーザー管理、権限変更、設定管理',
                    },
                  ].map((role) => (
                    <label
                      key={role.value}
                      className={`flex-1 flex flex-col gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                        roleForm.selectedRole === role.value
                          ? 'border-wood-light bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={roleForm.selectedRole === role.value}
                        onChange={(e) =>
                          updateRoleForm({
                            selectedRole: e.target.value as
                              | 'admin'
                              | 'editor'
                              | 'viewer',
                          })
                        }
                        disabled={loading}
                        className="sr-only"
                      />
                      {/* 上部：アイコンとロール名 */}
                      <div className="flex items-center gap-2 justify-center">
                        <div className={`${role.color} flex-shrink-0`}>
                          {role.icon}
                        </div>
                        <div className="text-base font-bold text-wood-dark">
                          {role.name}
                        </div>
                      </div>
                      {/* 下部：説明 */}
                      <div className="text-center">
                        <div className="text-xs font-medium text-wood-dark mb-1">
                          {role.description}
                        </div>
                        <div className="text-[10px] text-wood leading-tight">
                          {role.detailDescription}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 追加ボタン（中央下） */}
              <div className="flex justify-center pt-1">
                <button
                  onClick={handleAddRoleWithReset}
                  disabled={!roleForm.selectedUserId || loading}
                  className="px-6 py-2 bg-wood-light hover:bg-wood text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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

        {/* 現在のユーザー権限一覧 - コンパクトカードタイプ */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {userRoles.map((userRole) => {
            const removeCheck = canRemoveUserRole(userRole.userId, userRoles);
            const primaryRole = userRole.roles[0]; // 最初の権限を表示用として使用

            return (
              <div
                key={userRole.userId}
                className={`bg-white border border-gray-200 rounded-lg p-3 transition-all hover:shadow-md ${
                  loading ? 'opacity-60' : ''
                }`}
              >
                {/* ヘッダー：アイコン・権限・削除ボタン */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {userRole.roles.some((role) => role.name === 'admin') ? (
                      <FaUserShield className="h-4 w-4 text-red-600" />
                    ) : userRole.roles.some(
                        (role) => role.name === 'editor'
                      ) ? (
                      <FaEdit className="h-4 w-4 text-blue-600" />
                    ) : (
                      <FaEye className="h-4 w-4 text-gray-600" />
                    )}
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        primaryRole.name === 'admin'
                          ? 'bg-red-100 text-red-700'
                          : primaryRole.name === 'editor'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {primaryRole.name.charAt(0).toUpperCase() +
                        primaryRole.name.slice(1)}
                    </span>
                  </div>

                  {/* 削除ボタン */}
                  <button
                    onClick={() => handleRemoveRole(userRole.userId)}
                    className={`p-1 rounded transition-colors ${
                      removeCheck.canRemove && !loading
                        ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                    title={
                      loading
                        ? '処理中...'
                        : removeCheck.canRemove
                          ? '権限を削除'
                          : removeCheck.reason
                    }
                    disabled={loading || !removeCheck.canRemove}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-wood-light"></div>
                    ) : (
                      <FaTrash className="h-3 w-3" />
                    )}
                  </button>
                </div>

                {/* ユーザー名 */}
                <div className="mb-1">
                  <div className="flex items-center gap-1">
                    <div className="font-medium text-wood-dark text-sm leading-tight">
                      {userRole.user.username}
                    </div>
                    {creator && creator.id === userRole.userId && (
                      <div className="flex-shrink-0" title="作成者">
                        <FaUserShield className="h-3 w-3 text-yellow-600" />
                      </div>
                    )}
                  </div>
                </div>

                {/* 複数権限がある場合の表示 */}
                {userRole.roles.length > 1 && (
                  <div className="text-xs text-wood">
                    +{' '}
                    {userRole.roles
                      .slice(1)
                      .map((role) => role.name)
                      .join(', ')}
                  </div>
                )}
              </div>
            );
          })}

          {/* 空の状態 */}
          {userRoles.length === 0 && !loading && (
            <div className="col-span-full flex flex-col items-center justify-center py-8 text-wood">
              <FaUserShield className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-base font-medium mb-1">
                ユーザー権限が設定されていません
              </p>
              <p className="text-sm text-gray-500">
                上のフォームからユーザーと権限を追加してください
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 確認ダイアログ */}
      {confirmDialog.show && confirmDialog.data && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <FaExclamationTriangle className="h-6 w-6 text-orange-500 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">
                権限削除の確認
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              <strong>{confirmDialog.data.userName}</strong>{' '}
              の権限を削除しますか？
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelRemove}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmRemove}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* トーストメッセージ */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`rounded-lg p-4 shadow-lg max-w-sm ${
              toast.type === 'success'
                ? 'bg-green-100 border border-green-200'
                : toast.type === 'error'
                  ? 'bg-red-100 border border-red-200'
                  : 'bg-orange-100 border border-orange-200'
            }`}
          >
            <div className="flex items-center">
              {toast.type === 'success' && (
                <FaCheckCircle className="h-5 w-5 text-green-600 mr-3" />
              )}
              {toast.type === 'error' && (
                <FaExclamationTriangle className="h-5 w-5 text-red-600 mr-3" />
              )}
              {toast.type === 'warning' && (
                <FaInfoCircle className="h-5 w-5 text-orange-600 mr-3" />
              )}
              <span
                className={`text-sm font-medium ${
                  toast.type === 'success'
                    ? 'text-green-800'
                    : toast.type === 'error'
                      ? 'text-red-800'
                      : 'text-orange-800'
                }`}
              >
                {toast.message}
              </span>
              <button
                onClick={closeToast}
                className={`ml-3 p-1 rounded ${
                  toast.type === 'success'
                    ? 'text-green-600 hover:bg-green-200'
                    : toast.type === 'error'
                      ? 'text-red-600 hover:bg-red-200'
                      : 'text-orange-600 hover:bg-orange-200'
                }`}
              >
                <IoClose className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
