'use client';

import { ReactElement } from 'react';

import { ConnectedUser } from '@/features/prototype/types';
import { getUserColor } from '@/features/prototype/utils/userColor';
import { getRoleConfig } from '@/features/role/components/atoms/RoleBadge';

interface UserRoleListProps {
  users: ConnectedUser[];
  activeUserIds?: Set<string>;
}

export default function UserRoleList({
  users,
  activeUserIds = new Set(),
}: UserRoleListProps): ReactElement {
  return (
    <ul className="flex gap-1 flex-col">
      {users.map((user) => {
        const isActive = activeUserIds.has(user.userId);
        const color: string | undefined = isActive
          ? getUserColor(user.userId, users)
          : undefined;
        const roleConfig = user.roleName ? getRoleConfig(user.roleName) : null;
        const roleLabel = roleConfig ? roleConfig.label : user.roleName;
        const title = roleLabel
          ? `${roleLabel} - ${user.username}`
          : user.username;
        return (
          <li
            key={user.userId}
            className="truncate max-w-[180px] px-0 py-0 leading-6"
            title={title}
          >
            {isActive ? (
              <span className="inline-flex items-center gap-1">
                {roleConfig && (
                  <span className={roleConfig.textColor}>
                    {roleConfig.icon}
                  </span>
                )}
                <span
                  className="inline-flex items-center gap-1 px-1 rounded border"
                  style={{ borderColor: color }}
                >
                  <span
                    className="inline-block w-2 h-2"
                    style={{ backgroundColor: color }}
                  />
                  {user.username}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                {roleConfig && (
                  <span className={roleConfig.textColor}>
                    {roleConfig.icon}
                  </span>
                )}
                {user.username}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
