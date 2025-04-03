/**
 * @page プレビューページに表示するプレイヤー割り当てサイドバー
 */
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PiSidebarSimpleThin } from 'react-icons/pi';
import { Socket } from 'socket.io-client';

import { usePrototypes } from '@/api/hooks/usePrototypes';
import { Player, User } from '@/api/types';
import Dropdown from '@/components/atoms/Dropdown';
import { usePartOperations } from '@/features/prototype/hooks/usePartOperations';

export default function PlayerAssignmentSidebar({
  prototypeVersionId,
  groupId,
  players,
  socket,
}: {
  // プロトタイプバージョンID
  prototypeVersionId: string;
  // グループID
  groupId: string;
  // プレイヤー
  players: Player[];
  // ソケット
  socket: Socket;
}) {
  const router = useRouter();
  const { getAccessUsersByGroup } = usePrototypes();

  // サイドバーが最小化されているか
  const [isMinimized, setIsMinimized] = useState(false);
  // グループにアクセス可能なユーザー
  const [accessibleUsers, setAccessibleUsers] = useState<User[]>([]);
  const { assignPlayer } = usePartOperations(prototypeVersionId, socket);

  // グループにアクセス可能なユーザーを取得
  useEffect(() => {
    getAccessUsersByGroup(groupId).then((response) => {
      setAccessibleUsers(response);
    });
  }, [groupId, getAccessUsersByGroup]);

  return (
    <>
      {!isMinimized ? (
        <div
          className={`fixed h-full right-0 flex w-[240px] flex-col border-l border-gray-200 bg-white`}
        >
          <div className="flex items-center justify-between p-2">
            <PiSidebarSimpleThin
              onClick={() => setIsMinimized(true)}
              className="h-5 w-5 cursor-pointer flex-shrink-0"
            />
            <button
              onClick={() =>
                router.push(`/prototypes/groups/${groupId}/invite`)
              }
              className="h-fit w-fit rounded-md bg-[#0c8ce9] px-4 py-2 text-[11px] text-white"
            >
              アクセス権付与
            </button>
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
                        assignPlayer(player.id, userId ?? null);
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
        </div>
      ) : (
        <div className="fixed right-2 top-16 flex items-center justify-between gap-2 h-[48px] w-[250px] rounded-xl border bg-white p-4">
          <PiSidebarSimpleThin
            onClick={() => setIsMinimized(false)}
            className="h-5 w-5 cursor-pointer flex-shrink-0"
          />
          <button
            onClick={() => router.push(`/prototypes/groups/${groupId}/invite`)}
            className="h-fit w-fit rounded-md bg-[#0c8ce9] px-4 py-2 text-[11px] text-white"
          >
            アクセス権付与
          </button>
        </div>
      )}
    </>
  );
}
