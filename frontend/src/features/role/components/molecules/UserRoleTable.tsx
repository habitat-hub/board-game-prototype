import React, { useEffect, useState } from 'react';
import { FaTrash, FaUserShield } from 'react-icons/fa';

import { User } from '@/api/types/data-contracts';
import RoleSelect, { RoleValue } from '@/features/role/components/atoms/RoleSelect';
import UserAvatar from '@/features/role/components/atoms/UserAvatar';
import { useUser } from '@/hooks/useUser';

// 既定の権限（マジックナンバー回避）
export const DEFAULT_ROLE: RoleValue = 'viewer';

interface UserRole {
  userId: string;
  user: User;
  roles: Array<{ name: RoleValue; description: string }>;
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
    newRole: RoleValue
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
  onRoleChange: (newRole: RoleValue) => void;
  onRemove: (userId: string) => void;
  loading: boolean;
  canManageRole: boolean;
}

/**
 * 権限ドロップダウンのツールチップ文言を返す
 * - 変更不可のケースを優先して判定
 * @param isCreator プロジェクト作成者かどうか
 * @param isSelf 対象ユーザーが自分自身かどうか
 * @param loading ローディング中かどうか
 * @param canManageRole 権限管理が可能かどうか
 * @returns 表示用のタイトル文字列
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
  // プロジェクト作成者の場合（変更不可）
  if (isCreator) return 'プロジェクト作成者の権限は変更できません';
  // 自分自身の場合（変更不可）
  if (isSelf) return '自分の権限は変更できません';
  // 権限管理不可の場合（Admin以外は変更不可）
  if (!canManageRole) return '権限を設定できるのはAdminユーザーのみです';
  // ローディング中は操作不可
  if (loading) return '処理中...';
  return '権限を変更';
};

/**
 * 削除ボタンのツールチップ文言を返す
 * @param canRemove 権限削除が可能かどうか
 * @param removeReason 削除不可時の理由
 * @param loading ローディング中かどうか
 * @returns 表示用のタイトル文字列
 */
const getRemoveButtonTitle = ({
  canRemove,
  removeReason,
  loading,
}: {
  canRemove: boolean;
  removeReason: string;
  loading: boolean;
}): string => {
  // ローディング中は操作不可
  if (loading) return '処理中...';
  // 削除可能な場合
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
  // 先頭の権限名。未設定の場合は既定値にフォールバック
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

/**
 * プロジェクトのユーザー権限を表形式で表示するコンポーネント
 * @param userRoles 表示対象のユーザーと権限リスト
 * @param creator プロジェクト作成者（null の場合もあり）
 * @param canRemoveUserRole 権限削除可否と理由を判定する関数
 * @param onRoleChange 権限変更時のハンドラ
 * @param onRemove 権限削除時のハンドラ
 * @param loading ローディング状態
 * @param canManageRole 権限管理が可能かどうか
 */
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
  // ユーザー権限が未設定かつロード完了の場合の空状態
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
