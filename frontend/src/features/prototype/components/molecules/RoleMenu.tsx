/**
 * @page 権限管理ページへのフローティングメニューコンポーネント
 */

'use client';

import Link from 'next/link';
import { FaUsers } from 'react-icons/fa';

import ConnectedUserIcon from '@/features/prototype/components/atoms/ConnectedUserIcon';
import { MAX_DISPLAY_USERS } from '@/features/prototype/constants/presence';
import { ConnectedUser } from '@/features/prototype/types';
import { getUserColor } from '@/features/prototype/utils/userColor';

interface RoleMenuProps {
  projectId: string;
  connectedUsers: ConnectedUser[];
  loading?: boolean;
  showRoleManagementButton?: boolean;
}

export default function RoleMenu({
  projectId,
  connectedUsers,
  loading = false,
  showRoleManagementButton = true,
}: RoleMenuProps) {
  // ローディング中や空の場合は何も表示しない
  if (loading || !connectedUsers || connectedUsers.length === 0) {
    return null;
  }

  // ユーザー名リスト（最大3名まで表示、残りは+Nで省略）
  const displayUsers = connectedUsers.slice(0, MAX_DISPLAY_USERS);
  const moreCount = connectedUsers.length - MAX_DISPLAY_USERS;

  return (
    <div
      className={`fixed top-4 right-4 z-overlay flex flex-row items-center justify-between ${showRoleManagementButton ? 'max-w-[150px]' : 'max-w-[100px]'} h-[56px] bg-kibako-white p-2 rounded-lg`}
    >
      {/* ユーザーアイコンリスト（左側・ホバーで全ユーザー名表示） */}
      <div className="relative group">
        <button
          className="flex flex-row items-center focus:outline-none"
          aria-label="ユーザーリストを表示"
          tabIndex={0}
        >
          <div className="flex -space-x-3">
            {displayUsers.map((user, idx) => (
              <ConnectedUserIcon
                key={user.userId || `user-${idx}`}
                user={user}
                index={idx}
              />
            ))}
          </div>
          {moreCount > 0 && (
            <span className="text-xs text-kibako-secondary ml-2">
              +{moreCount}
            </span>
          )}
        </button>
        <div className="absolute right-0 mt-2 max-w-xs bg-kibako-white border border-kibako-secondary rounded shadow z-tooltip px-3 py-2 text-xs text-kibako-primary opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200">
          <ul>
            {connectedUsers.map((user) => {
              const color = getUserColor(user.userId, user.username);
              return (
                <li
                  key={user.userId}
                  className="truncate max-w-[180px] px-0 py-0 leading-6"
                  title={user.username}
                >
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
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {/* 権限管理ページへのリンク（右側） - showRoleManagementButtonがtrueの時のみ表示 */}
      {showRoleManagementButton && (
        <Link
          href={`/projects/${projectId}/roles`}
          className="group flex items-center justify-center w-10 h-10 relative hover:bg-kibako-tertiary rounded transition-colors ml-2"
          title="権限管理ページへ"
        >
          <FaUsers className="h-5 w-5 text-kibako-primary" />
          <span className="absolute left-1/2 bottom-[-40px] transform -translate-x-1/2 bg-kibako-primary text-kibako-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            権限管理
          </span>
        </Link>
      )}
    </div>
  );
}
