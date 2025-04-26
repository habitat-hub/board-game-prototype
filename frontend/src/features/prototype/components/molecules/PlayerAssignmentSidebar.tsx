/**
 * @page プレビューページに表示するプレイヤー割り当てサイドバー
 */
'use client';

import { useEffect, useState } from 'react';
import {
  TbLayoutSidebarRightCollapse,
  TbLayoutSidebarRightExpand,
} from 'react-icons/tb';

import { usePrototypes } from '@/api/hooks/usePrototypes';
import { Player, User } from '@/api/types';
import Dropdown from '@/components/atoms/Dropdown';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';

export default function PlayerAssignmentSidebar({
  groupId,
  players,
}: {
  // グループID
  groupId: string;
  // プレイヤー
  players: Player[];
}) {
  const { dispatch } = usePartReducer();
  const { getAccessUsersByGroup } = usePrototypes();

  // サイドバーが最小化されているか
  const [isMinimized, setIsMinimized] = useState(false);
  // グループにアクセス可能なユーザー
  const [accessibleUsers, setAccessibleUsers] = useState<User[]>([]);

  // グループにアクセス可能なユーザーを取得
  useEffect(() => {
    getAccessUsersByGroup(groupId).then((response) => {
      setAccessibleUsers(response);
    });
  }, [groupId, getAccessUsersByGroup]);

  return (
    <>
      <div
        className={`fixed h-full right-0 flex flex-col border-l border-gray-200 bg-white transition-all duration-300 ease-in-out ${
          isMinimized
            ? 'w-12 rounded-xl border top-14 right-4 h-auto max-h-[48px] translate-x-0'
            : 'w-[240px] translate-x-0'
        }`}
      >
        {isMinimized ? (
          <div className="flex flex-col items-center justify-between gap-2 p-4">
            <TbLayoutSidebarRightExpand
              onClick={() => setIsMinimized(false)}
              className="h-5 w-5 cursor-pointer flex-shrink-0"
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-2 h-16">
              <TbLayoutSidebarRightCollapse
                onClick={() => setIsMinimized(true)}
                className="h-5 w-5 cursor-pointer flex-shrink-0"
              />
            </div>
            <div className="border-b border-gray-200"></div>
            <div className="flex flex-col gap-2 p-4">
              <span className="mb-2 text-[11px] font-medium">
                プレイヤー割り当て
              </span>
              <div className="flex flex-col gap-1">
                {players.map((player) => (
                  <div key={player.id}>
                    <p className="text-[9px] font-medium text-gray-500 mb-1">
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
    </>
  );
}
