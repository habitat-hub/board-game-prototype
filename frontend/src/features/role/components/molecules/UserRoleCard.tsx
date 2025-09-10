import React, { useEffect, useState } from 'react';
import { FaInfoCircle, FaTrash } from 'react-icons/fa';

import { getRoleConfig } from '../atoms/RoleBadge';
import UserAvatar from '../atoms/UserAvatar';

interface UserRoleWithDetails {
  userId: string;
  user: {
    id: string;
    username: string;
    createdAt: string;
    updatedAt: string;
  };
  roles: Array<{ name: string; description: string }>;
}

interface UserRoleCardProps {
  userRole: UserRoleWithDetails;
  isCreator: boolean;
  isSelf: boolean;
  isLastAdmin: boolean;
  canRemove: boolean;
  removeReason: string;
  onRoleChange: (newRole: 'admin' | 'editor' | 'viewer') => void;
  onRemove: (userId: string) => void;
  loading: boolean;
  canManageRole: boolean;
}

/**
 * ドロップダウンのタイトルを返す
 */
const getRoleDropdownTitle = ({
  isCreator,
  isSelf,
  loading,
  canManageRole,
}: {
  isCreator: boolean;
  isSelf: boolean;
  loading: boolean;
  canManageRole: boolean;
}): string => {
  if (isCreator) return 'プロジェクト作成者の権限は変更できません';
  if (isSelf) return '自分の権限は変更できません';
  if (!canManageRole) return '権限を設定できるのはAdminユーザーのみです';
  if (loading) return '処理中...';
  return '権限を変更';
};

const getRemoveButtonTitle = ({
  canRemove,
  removeReason,
  loading,
}: {
  canRemove: boolean;
  removeReason: string;
  loading: boolean;
}) => {
  if (loading) return '処理中...';
  if (canRemove) return '権限を削除';
  return removeReason;
};

const UserRoleCard: React.FC<UserRoleCardProps> = ({
  userRole,
  isCreator,
  isSelf,
  isLastAdmin: _isLastAdmin, // 現在未使用のため_プレフィックスを追加
  canRemove,
  removeReason,
  onRoleChange,
  onRemove,
  loading,
  canManageRole,
}) => {
  const primaryRole = userRole.roles[0];
  const [selectedRole, setSelectedRole] = useState(primaryRole.name);
  useEffect(() => {
    setSelectedRole(primaryRole.name);
  }, [primaryRole.name]);
  const dropdownTitle = getRoleDropdownTitle({
    isCreator,
    isSelf,
    loading,
    canManageRole,
  });
  const removeTitle = getRemoveButtonTitle({
    canRemove,
    removeReason,
    loading,
  });
  const currentConfig = getRoleConfig(selectedRole);
  const roles = ['admin', 'editor', 'viewer'] as const;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as 'admin' | 'editor' | 'viewer';
    setSelectedRole(newRole);
    onRoleChange(newRole);
  };

  return (
    <div
      className={`bg-kibako-white border border-kibako-secondary/20 rounded-lg p-4 transition-all hover:shadow-md ${
        loading ? 'opacity-60' : ''
      }`}
    >
      {/* ヘッダー：ユーザー情報 */}
      <div className="flex items-center gap-3 mb-3">
        <UserAvatar username={userRole.user.username} size="lg" />

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="font-medium text-kibako-primary">
              {userRole.user.username}
            </div>
          </div>

          {/* 権限ドロップダウン */}
          <div className="mt-1 flex items-center gap-2">
            <span className={currentConfig.textColor}>
              {currentConfig.icon}
            </span>
            <select
              value={selectedRole}
              onChange={handleChange}
              disabled={isCreator || isSelf || loading || !canManageRole}
              title={dropdownTitle}
              aria-label={dropdownTitle}
              className="border border-kibako-secondary/20 rounded px-2 py-1 text-sm text-kibako-primary bg-kibako-white disabled:opacity-50"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {getRoleConfig(role).label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* アクションボタン群 */}
        <div className="flex gap-1">
          {/* 削除ボタン */}
          <button
            type="button"
            onClick={() => onRemove(userRole.userId)}
            className={`p-2 rounded transition-colors ${
              canRemove && !loading && canManageRole
                ? 'text-kibako-primary/60 hover:text-kibako-danger hover:bg-kibako-danger/30'
                : 'text-kibako-secondary/50 cursor-not-allowed'
            }`}
            title={removeTitle}
            aria-label={removeTitle}
            disabled={loading || !canRemove || !canManageRole}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-kibako-secondary"></div>
            ) : (
              <FaTrash className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* 複数権限がある場合の表示 */}
      {userRole.roles.length > 1 && (
        <div className="mt-3 pt-3 border-t border-kibako-secondary/10">
          <div className="text-xs text-kibako-primary/70">
            その他の権限:{' '}
            {userRole.roles
              .slice(1)
              .map((role) => role.name)
              .join(', ')}
          </div>
        </div>
      )}

      {/* 制限の説明 */}
      {isCreator && (
        <div className="mt-3 pt-3 border-t border-kibako-secondary/10">
          <div className="text-xs text-kibako-primary/70 flex items-center gap-1">
            <div>
              <div className="text-kibako-accent font-medium">
                プロジェクト作成者
              </div>
              <div className="flex items-center gap-1">
                <FaInfoCircle className="h-3 w-3" />
                <span>権限は変更できません</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRoleCard;
