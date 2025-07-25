/**
 * @page 権限管理ページへのフローティングメニューコンポーネント
 */

'use client';

import Link from 'next/link';
import { FaUsers } from 'react-icons/fa';

interface RoleMenuProps {
  projectId: string;
  userRoles: Array<{
    userId: string;
    user: { id: string; username: string };
    roles: Array<{ name: string; description: string }>;
  }>;
  loading?: boolean;
}

export default function RoleMenu({
  projectId,
  userRoles,
  loading = false,
}: RoleMenuProps) {
  // ローディング中や空の場合は何も表示しない
  if (loading || !userRoles || userRoles.length === 0) {
    return null;
  }

  // ユーザー名リスト（最大3名まで表示、残りは+Nで省略）
  const maxDisplay = 3;
  const userNames = userRoles.map((ur) => ur.user.username);
  const displayNames = userNames.slice(0, maxDisplay);
  const moreCount = userNames.length - maxDisplay;

  return (
    <div className="fixed top-4 right-4 z-[10000] flex flex-row items-center justify-between max-w-[150px] h-[56px] bg-content p-2 rounded-lg">
      {/* ユーザーアイコンリスト（左側・ホバーで全ユーザー名表示） */}
      <div className="relative group">
        <button
          className="flex flex-row items-center focus:outline-none"
          aria-label="ユーザーリストを表示"
          tabIndex={0}
        >
          <div className="flex -space-x-3">
            {displayNames.map((name, idx) => {
              const userRole = userRoles[idx];
              return (
                <span
                  key={userRole.user.id || `user-${idx}`}
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-wood-light text-wood-dark font-bold text-sm select-none border-2 border-content shadow-sm"
                  style={{ zIndex: 10 - idx }}
                  title={name}
                >
                  {name.charAt(0).toUpperCase()}
                </span>
              );
            })}
          </div>
          {moreCount > 0 && (
            <span className="text-xs text-kibako-secondary ml-2">
              +{moreCount}
            </span>
          )}
        </button>
        <div className="absolute right-0 mt-2 max-w-xs bg-kibako-white border border-wood-light rounded shadow z-20 px-3 py-2 text-xs text-wood-dark opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200">
          <ul>
            {userNames.map((name) => (
              <li
                key={name}
                className="truncate max-w-[180px] px-0 py-0 leading-6"
                title={name}
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* 権限管理ページへのリンク（右側） */}
      <Link
        href={`/projects/${projectId}/roles`}
        className="group flex items-center justify-center w-10 h-10 relative hover:bg-content-secondary rounded transition-colors ml-2"
        title="権限管理ページへ"
      >
        <FaUsers className="h-5 w-5 text-wood-dark" />
        <span className="absolute left-1/2 bottom-[-40px] transform -translate-x-1/2 bg-header text-kibako-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          権限管理
        </span>
      </Link>
    </div>
  );
}
