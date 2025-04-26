/**
 * @page 編集ページのサイドバーをまとめたコンポーネント
 */

'use client';

import { Part, PartProperty, Player } from '@/api/types';
import PartCreateSidebar from '@/features/prototype/components/molecules/PartCreateSidebar';
import PartPropertySidebar from '@/features/prototype/components/molecules/PartPropertySidebar';
import { AddPartProps } from '@/features/prototype/type';

export default function EditSidebars({
  prototypeName,
  prototypeVersionNumber,
  groupId,
  players,
  selectedPartId,
  parts,
  properties,
  onAddPart,
  onDeletePart,
}: {
  // プロトタイプ名
  prototypeName: string;
  // プロトタイプバージョン番号
  prototypeVersionNumber?: string;
  // グループID
  groupId: string;
  // プレイヤー
  players: Player[];
  // 選択中のパーツID
  selectedPartId: number | null;
  // パーツ
  parts: Part[];
  // パーツのプロパティ
  properties: PartProperty[];
  // パーツを追加時の処理
  onAddPart: ({ part, properties }: AddPartProps) => void;
  // パーツを削除時の処理
  onDeletePart: () => void;
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
      />

      {/* Right Sidebar */}
      <PartPropertySidebar
        players={players}
        selectedPartId={selectedPartId}
        parts={parts}
        properties={properties}
        onAddPart={onAddPart}
        onDeletePart={onDeletePart}
      />
    </>
  );
}
