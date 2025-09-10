'use client';

import { ReactElement } from 'react';

import { ConnectedUser } from '@/features/prototype/types';
import { getUserColor } from '@/features/prototype/utils/userColor';
import { getRoleConfig } from '@/features/role/components/atoms/RoleBadge';

// ロールバッジ表示の設定型
type RoleConfig = {
  icon: ReactElement;
  bgColor: string;
  textColor: string;
  label: string;
};

interface UserRoleListProps {
  /** 表示対象のユーザー一覧（イミュータブル） */
  users: ReadonlyArray<ConnectedUser>;
  /** 接続中ユーザーIDの集合 */
  activeUserIds?: ReadonlySet<string>;
}

/**
 * ユーザーの役割リストを表示する
 * @param users 表示対象のユーザー一覧（イミュータブル）
 * @param activeUserIds 接続中ユーザーIDの集合（既定: 空の集合）
 * @returns ユーザー名と役割バッジのリスト要素
 */
export default function UserRoleList({
  users,
  activeUserIds = new Set<string>(),
}: UserRoleListProps): ReactElement {
  const readonlyUsers: ReadonlyArray<ConnectedUser> = users;
  const readonlyActiveUserIds: ReadonlySet<string> = activeUserIds;
  return (
    <ul className="flex gap-1 flex-col">
      {readonlyUsers.map((user) => {
        const isActive: boolean = readonlyActiveUserIds.has(user.userId);
        const color: string | undefined = isActive
          ? getUserColor(user.userId, readonlyUsers)
          : undefined;
        const roleConfig: RoleConfig | null = user.roleName
          ? getRoleConfig(user.roleName)
          : null;
        const roleLabel: string | undefined = roleConfig
          ? roleConfig.label
          : user.roleName;
        const title: string = roleLabel
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
