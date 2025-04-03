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
  selectedPart,
  selectedPartProperties,
  onAddPart,
  onDeletePart,
  updatePart,
  mainViewRef,
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
  // パーツを更新時の処理
  updatePart: (
    // パーツID
    partId: number,
    // 更新するパーツ情報
    updatePart?: Partial<Part>,
    // 更新するパーツのプロパティ情報
    updateProperties?: Partial<PartProperty>[],
    // パーツを反転させるかどうか
    isFlipped?: boolean
  ) => void;
  // メインビューのref
  mainViewRef: React.RefObject<HTMLDivElement>;
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
        updatePart={updatePart}
      />
    </>
  );
}
