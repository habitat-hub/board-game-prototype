import React, { useEffect, useState } from 'react';
import { FaUserShield, FaTrash } from 'react-icons/fa';

import { User } from '@/api/types/data-contracts';
import { useUser } from '@/hooks/useUser';

import RoleSelect, { RoleValue } from '../atoms/RoleSelect';
import UserAvatar from '../atoms/UserAvatar';

interface UserRole {
  userId: string;
  user: User;
  roles: Array<{ name: string; description: string }>;
}

interface UserRoleTableProps {
  userRoles: UserRole[];
  creator: User | null;
  canRemoveUserRole: (
    userId: string,
    userRoles: UserRole[]
  ) => {
    canRemove: boolean;
    reason: string;
  };
  onRoleChange: (
    userId: string,
    newRole: 'admin' | 'editor' | 'viewer'
  ) => void;
  onRemove: (userId: string) => void;
  loading: boolean;
  canManageRole: boolean;
}

interface UserRoleRowProps {
  userRole: UserRole;
  isCreator: boolean;
  isSelf: boolean;
  canRemove: boolean;
  removeReason: string;
  onRoleChange: (newRole: 'admin' | 'editor' | 'viewer') => void;
  onRemove: (userId: string) => void;
  loading: boolean;
  canManageRole: boolean;
}

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

const UserRoleRow: React.FC<UserRoleRowProps> = ({
  userRole,
  isCreator,
  isSelf,
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
  const handleChange = (newRole: RoleValue) => {
    setSelectedRole(newRole);
    onRoleChange(newRole);
  };

  return (
    <tr className={loading ? 'opacity-60' : ''}>
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <UserAvatar username={userRole.user.username} size="lg" />
          <div>
            <div className="font-medium text-kibako-primary">
              {userRole.user.username}
            </div>
            {userRole.roles.length > 1 && (
              <div className="text-xs text-kibako-primary/70">
                その他の権限:{' '}
                {userRole.roles
                  .slice(1)
                  .map((role) => role.name)
                  .join(', ')}
              </div>
            )}
          </div>
        </div>
      </td>
      <td
        className="px-4 py-2 text-center"
        title={isCreator ? 'プロジェクト作成者' : ''}
      >
        {isCreator && (
          <span className="text-kibako-primary" aria-label="作成者">
            ✓
          </span>
        )}
      </td>
      <td className="px-4 py-2">
        <RoleSelect
          value={selectedRole as RoleValue}
          onChange={handleChange}
          disabled={isCreator || isSelf || loading || !canManageRole}
          title={dropdownTitle}
          aria-label={dropdownTitle}
        />
      </td>
      <td className="px-4 py-2">
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
      </td>
    </tr>
  );
};

const UserRoleTable: React.FC<UserRoleTableProps> = ({
  userRoles,
  creator,
  canRemoveUserRole,
  onRoleChange,
  onRemove,
  loading,
  canManageRole,
}) => {
  const { user: currentUser } = useUser();
  if (userRoles.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-kibako-secondary">
        <FaUserShield className="h-12 w-12 text-kibako-secondary/50 mb-4" />
        <p className="text-lg font-medium mb-2">
          ユーザー権限が設定されていません
        </p>
        <p className="text-sm text-kibako-primary/70">
          上のフォームからユーザーと権限を追加してください
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-kibako-secondary/20">
        <thead className="bg-kibako-secondary/10">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-kibako-primary">
              ユーザー
            </th>
            <th className="px-4 py-2 text-center text-sm font-medium text-kibako-primary">
              作成者
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-kibako-primary">
              権限
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-kibako-primary">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-kibako-secondary/10">
          {userRoles.map((userRole) => {
            const removeCheck = canRemoveUserRole(userRole.userId, userRoles);
            const isCreator = creator && creator.id === userRole.userId;
            const isSelf = currentUser?.id === userRole.userId;

            return (
              <UserRoleRow
                key={userRole.userId}
                userRole={userRole}
                isCreator={!!isCreator}
                isSelf={!!isSelf}
                canRemove={removeCheck.canRemove}
                removeReason={removeCheck.reason}
                onRoleChange={(role) => onRoleChange(userRole.userId, role)}
                onRemove={onRemove}
                loading={loading}
                canManageRole={canManageRole}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserRoleTable;
