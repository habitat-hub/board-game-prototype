'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import { FaUserPlus } from 'react-icons/fa6';

import { User } from '@/api/types';
import { useUser } from '@/hooks/useUser';

interface AccessUsersCardProps {
  accessUsers: User[];
  groupId: string;
  prototypeOwnerId?: string;
}

const AccessUsersCard: React.FC<AccessUsersCardProps> = ({
  accessUsers,
  groupId,
  prototypeOwnerId,
}) => {
  const router = useRouter();
  const { user } = useUser();

  return (
    <div className="flex-1 bg-white/80 rounded-xl p-5 shadow-inner border border-wood-lightest/40">
      <h3 className="text-sm uppercase tracking-wide text-wood-dark/70 mb-2 font-medium">
        参加ユーザー
      </h3>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-wood-darkest/70">
          {accessUsers.length}人が参加中
        </span>
        {prototypeOwnerId && user?.id === prototypeOwnerId ? (
          <button
            onClick={() => router.push(`/groups/${groupId}/roles`)}
            className="p-1.5 text-wood hover:text-header rounded-md hover:bg-wood-lightest/20 transition-all"
            title="他ユーザー招待"
          >
            <FaUserPlus className="h-4 w-4" />
          </button>
        ) : (
          <button
            disabled
            className="p-1.5 text-wood-light/50 cursor-not-allowed rounded-md"
            title="プロトタイプのオーナーのみが招待できます"
          >
            <FaUserPlus className="h-4 w-4" />
          </button>
        )}
      </div>
      {accessUsers.length > 0 ? (
        <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-2">
          {accessUsers.map((accessUser) => (
            <div
              key={accessUser.id}
              className={`px-3 py-1.5 text-sm rounded-full flex items-center gap-1.5 border ${
                accessUser.id === prototypeOwnerId
                  ? 'bg-header/10 text-header border-header/30'
                  : 'bg-wood-lightest/50 text-wood-darkest border-wood-light/30'
              }`}
            >
              <span className="max-w-[120px] truncate">
                {accessUser.username}
              </span>
              {accessUser.id === prototypeOwnerId && (
                <span className="text-[10px] px-1.5 py-0.5 bg-header/10 text-header rounded-md border border-header/30">
                  オーナー
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-wood-dark text-sm italic">ユーザーデータ取得中...</p>
      )}
    </div>
  );
};

export default AccessUsersCard;
