/**
 * @page プレビューページのサイドバーをまとめたコンポーネント
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IoArrowBack, IoMenu } from 'react-icons/io5';

import { usePrototypes } from '@/api/hooks/usePrototypes';
import { Player, User } from '@/api/types';
import Dropdown from '@/components/atoms/Dropdown';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';

// サイドバーヘッダーコンポーネント
function SidebarHeader({
  prototypeName,
  prototypeVersionNumber,
  groupId,
  isMinimized,
  onToggle,
}: {
  prototypeName: string;
  prototypeVersionNumber?: string;
  groupId: string;
  isMinimized: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex h-[48px] items-center justify-between p-4">
      <button
        onClick={() => router.push(`/prototypes/groups/${groupId}`)}
        className="p-2 hover:bg-wood-lightest/20 rounded-full transition-colors flex-shrink-0"
        title="戻る"
      >
        <IoArrowBack className="h-5 w-5 text-wood-dark hover:text-header transition-colors" />
      </button>
      <div className="flex items-center gap-1 flex-grow ml-2 min-w-0">
        <h2
          className="text-xs font-medium truncate text-wood-darkest"
          title={prototypeName}
        >
          {prototypeName}
        </h2>
        {prototypeVersionNumber && (
          <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-600 rounded-md min-w-1 border border-blue-600 flex-shrink-0">
            {prototypeVersionNumber === 'MASTER'
              ? 'プレビュー'
              : `プレイルーム${prototypeVersionNumber.replace('.0.0', '')}`}
          </span>
        )}
      </div>
      <button
        onClick={onToggle}
        aria-label={isMinimized ? 'サイドバーを展開' : 'サイドバーを最小化'}
        className="p-2 rounded-full transition-transform hover:scale-110"
      >
        <IoMenu className="h-5 w-5 text-wood-dark hover:text-header transition-colors" />
      </button>
    </div>
  );
}

export default function PreviewSidebars({
  prototypeName,
  prototypeVersionNumber,
  groupId,
  players,
}: {
  // プロトタイプ名
  prototypeName: string;
  // プロトタイプバージョン番号
  prototypeVersionNumber?: string;
  // グループID
  groupId: string;
  // プレイヤー
  players: Player[];
}) {
  const { dispatch } = usePartReducer();
  const { getAccessUsersByGroup } = usePrototypes();

  // 左サイドバーが最小化されているか
  const [isLeftSidebarMinimized, setIsLeftSidebarMinimized] = useState(false);
  // グループにアクセス可能なユーザー
  const [accessibleUsers, setAccessibleUsers] = useState<User[]>([]);

  // グループにアクセス可能なユーザーを取得
  useEffect(() => {
    getAccessUsersByGroup(groupId).then((response) => {
      setAccessibleUsers(response);
    });
  }, [groupId, getAccessUsersByGroup]);

  const toggleSidebar = () => {
    setIsLeftSidebarMinimized(!isLeftSidebarMinimized);
  };

  return (
    <div
      className={`fixed left-4 top-4 flex flex-col rounded-xl border border-wood-lightest/40 bg-gradient-to-r from-content to-content-secondary shadow-md w-[240px] ${
        !isLeftSidebarMinimized ? 'overflow-auto max-h-[90vh]' : 'h-[48px]'
      }`}
    >
      <SidebarHeader
        prototypeName={prototypeName}
        prototypeVersionNumber={prototypeVersionNumber}
        groupId={groupId}
        isMinimized={isLeftSidebarMinimized}
        onToggle={toggleSidebar}
      />

      {!isLeftSidebarMinimized && (
        <>
          <div className="border-b border-wood-light/30" />
          <div className="flex flex-col gap-2 p-4">
            <div className="flex flex-col items-start justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wide text-wood-dark/70">
                プレイヤー割り当て
              </span>
              <details className="text-xs">
                <summary className="cursor-pointer text-wood-dark/60 hover:text-wood-dark">
                  詳細
                </summary>
                <div className="p-2 mt-1 bg-wood-lightest/20 rounded-md text-wood-dark/80">
                  手札のプレイヤー番号とユーザーを紐づけます。
                </div>
              </details>
            </div>
            <div className="flex flex-col gap-1">
              {players.map((player) => (
                <div key={player.id}>
                  <p className="text-[9px] font-medium text-wood-dark mb-1">
                    {player.playerName}
                  </p>
                  <div className="flex w-full mb-2">
                    <Dropdown
                      value={
                        accessibleUsers.find(
                          (user) => user.id === player.userId
                        )?.username || 'プレイヤーを選択'
                      }
                      onChange={(value: string) => {
                        const userId = accessibleUsers.find(
                          (user) => user.username === value
                        )?.id;
                        dispatch({
                          type: 'UPDATE_PLAYER_USER',
                          payload: {
                            playerId: player.id,
                            userId: userId ?? null,
                          },
                        });
                      }}
                      options={[
                        'プレイヤーを選択',
                        ...accessibleUsers.map((user) => user.username),
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
