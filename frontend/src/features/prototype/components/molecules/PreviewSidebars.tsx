/**
 * @page プレビューページのサイドバーをまとめたコンポーネント
 */

'use client';

import { useRouter } from 'next/navigation';
import { IoArrowBack } from 'react-icons/io5';

import { Player } from '@/api/types';
import PlayerAssignmentSidebar from '@/features/prototype/components/molecules/PlayerAssignmentSidebar';

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
  const router = useRouter();

  return (
    <>
      {/* Left Sidebar */}
      <div className="fixed left-2 top-14 flex h-[48px] w-[250px] items-center justify-between rounded-xl border bg-white p-4">
        <button
          onClick={() => router.push(`/prototypes/groups/${groupId}`)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          title="戻る"
        >
          <IoArrowBack className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-2 flex-grow ml-2 min-w-0">
          <h2 className="text-sm font-medium truncate" title={prototypeName}>
            {prototypeName}
          </h2>
          {prototypeVersionNumber && (
            <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-600 rounded-md min-w-1 border border-blue-600 flex-shrink-0">
              v{prototypeVersionNumber}
            </span>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <PlayerAssignmentSidebar groupId={groupId} players={players} />
    </>
  );
}
