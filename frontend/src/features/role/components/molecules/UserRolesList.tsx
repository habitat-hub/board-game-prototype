import React from 'react';
import { FaUserShield } from 'react-icons/fa';

import { User } from '@/api/types/data-contracts';

import UserRoleCard from './UserRoleCard';

interface UserRole {
  userId: string;
  user: User;
  roles: Array<{ name: string; description: string }>;
}

interface UserRolesListProps {
  userRoles: UserRole[];
  creator: User | null;
  canRemoveUserRole: (
    userId: string,
    userRoles: UserRole[]
  ) => {
    canRemove: boolean;
    reason: string;
  };
  onEdit: (userId: string, username: string, roleName: string) => void;
  onRemove: (userId: string) => void;
  loading: boolean;
  editMode: boolean;
}

const UserRolesList: React.FC<UserRolesListProps> = ({
  userRoles,
  creator,
  canRemoveUserRole,
  onEdit,
  onRemove,
  loading,
  editMode,
}) => {
  if (userRoles.length === 0 && !loading) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-12 text-wood">
        <FaUserShield className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-lg font-medium mb-2">
          ユーザー権限が設定されていません
        </p>
        <p className="text-sm text-gray-500">
          上のフォームからユーザーと権限を追加してください
        </p>
      </div>
    );
  }

  return (
    <>
      {userRoles.map((userRole) => {
        const removeCheck = canRemoveUserRole(userRole.userId, userRoles);
        const isCreator = creator && creator.id === userRole.userId;
        const hasAdminRole = userRole.roles.some(
          (role) => role.name === 'admin'
        );
        const adminCount = userRoles.filter((ur) =>
          ur.roles.some((role) => role.name === 'admin')
        ).length;
        const isLastAdmin = hasAdminRole && adminCount <= 1;

        return (
          <UserRoleCard
            key={userRole.userId}
            userRole={userRole}
            isCreator={!!isCreator}
            isLastAdmin={isLastAdmin}
            canRemove={removeCheck.canRemove}
            removeReason={removeCheck.reason}
            onEdit={onEdit}
            onRemove={onRemove}
            loading={loading}
            editMode={editMode}
          />
        );
      })}
    </>
  );
};

export default UserRolesList;
