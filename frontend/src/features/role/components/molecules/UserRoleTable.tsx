import React from 'react';
import { FaUserShield } from 'react-icons/fa';

import { User } from '@/api/types/data-contracts';
import type { RoleValue } from '@/features/role/types';
import type { UserRole } from '@/features/role/types';
import { useUser } from '@/hooks/useUser';

import UserRoleRow from './UserRoleRow';

// Types moved to UserRoleRow.tsx

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
  onRoleChange: (userId: string, newRole: RoleValue) => void;
  onRemove: (userId: string) => void;
  loading: boolean;
  canManageRole: boolean;
}
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
  if ((userRoles ?? []).length === 0 && !loading) {
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
