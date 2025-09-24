import React, { useEffect, useState } from 'react';
import { FaTrash } from 'react-icons/fa';

import { ROLE_LABELS } from '@/constants/roles';
import RoleSelect from '@/features/role/components/atoms/RoleSelect';
import UserAvatar from '@/features/role/components/atoms/UserAvatar';
import type { RoleValue, UserRole } from '@/features/role/types';

import { getRemoveButtonTitle, getRoleDropdownTitle } from './userRoleTitles';

/** デフォルト権限。ロール未設定時に使用する */
export const DEFAULT_ROLE: RoleValue = 'viewer';

/** 行コンポーネントの受け取りプロパティ */
interface UserRoleRowProps {
  userRole: UserRole;
  isCreator: boolean;
  isSelf: boolean;
  canRemove: boolean;
  removeReason: string;
  onRoleChange: (newRole: RoleValue) => void;
  onRemove: (userId: string) => void;
  loading: boolean;
  canManageRole: boolean;
}

/** ユーザー1名分の権限行を表示する */
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
  const primaryRoleName: RoleValue =
    userRole.roles.length > 0 ? userRole.roles[0].name : DEFAULT_ROLE;
  const [selectedRole, setSelectedRole] = useState<RoleValue>(primaryRoleName);
  useEffect(() => {
    setSelectedRole(primaryRoleName);
  }, [primaryRoleName]);

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
  const handleChange = (newRole: RoleValue): void => {
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
                  .map((role) => ROLE_LABELS[role.name] ?? role.name)
                  .join('、')}
              </div>
            )}
          </div>
        </div>
      </td>
      <td
        className="px-4 py-2 text-center"
        title={isCreator ? 'プロジェクト作成者' : ''}
      >
        {/* 作成者の場合: チェックを表示 */}
        {isCreator && (
          <span className="text-kibako-primary" aria-label="作成者">
            ✓
          </span>
        )}
      </td>
      <td className="px-4 py-2">
        <RoleSelect
          value={selectedRole}
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
          {/* ローディング中はスピナー、未ローディングはゴミ箱アイコン */}
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

export default UserRoleRow;
