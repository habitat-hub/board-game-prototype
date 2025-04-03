/**
 * @page 編集ページのサイドバーをまとめたコンポーネント
 */

'use client';

import { Socket } from 'socket.io-client';

import { Part, PartProperty, Player } from '@/api/types';
import PartCreateSidebar from '@/features/prototype/components/molecules/PartCreateSidebar';
import PartPropertySidebar from '@/features/prototype/components/molecules/PartPropertySidebar';
import { AddPartProps } from '@/features/prototype/type';
export default function EditSidebars({
  prototypeName,
  prototypeVersionNumber,
  groupId,
  players,
  selectedPart,
  selectedPartProperties,
  onAddPart,
  onDeletePart,
  mainViewRef,
  socket,
  prototypeVersionId,
}: {
  // プロトタイプ名
  prototypeName: string;
  // プロトタイプバージョン番号
  prototypeVersionNumber?: string;
  // グループID
  groupId: string;
  // プレイヤー
  players: Player[];
  // 選択中のパーツ
  selectedPart: Part | null;
  // 選択中のパーツのプロパティ
  selectedPartProperties: PartProperty[] | null;
  // パーツを追加時の処理
  onAddPart: ({ part, properties }: AddPartProps) => void;
  // パーツを削除時の処理
  onDeletePart: () => void;
  // メインビューのref
  mainViewRef: React.RefObject<HTMLDivElement>;
  // ソケット
  socket: Socket;
  // プロトタイプバージョンID
  prototypeVersionId: string;
}) {
  return (
    <>
      {/* Left Sidebar */}
      <PartCreateSidebar
        prototypeName={prototypeName}
        prototypeVersionNumber={prototypeVersionNumber}
        groupId={groupId}
        players={players}
        onAddPart={onAddPart}
        mainViewRef={mainViewRef}
      />

      {/* Right Sidebar */}
      <PartPropertySidebar
        groupId={groupId}
        players={players}
        selectedPart={selectedPart}
        selectedPartProperties={selectedPartProperties}
        onAddPart={onAddPart}
        onDeletePart={onDeletePart}
        socket={socket}
        prototypeVersionId={prototypeVersionId}
      />
    </>
  );
}
