/**
 * @page 編集ページのサイドバーをまとめたコンポーネント
 */

'use client';

import { Part, PartProperty, Player } from '@/api/types';
import PartCreateSidebar from '@/features/prototype/components/molecules/PartCreateSidebar';
import PartPropertySidebar from '@/features/prototype/components/molecules/PartPropertySidebar';
import ShortcutHelpPanel from '@/features/prototype/components/molecules/ShortcutHelpPanel';
import { AddPartProps } from '@/features/prototype/type';

export default function EditSidebars({
  prototypeName,
  groupId,
  players,
  selectedPartId,
  selectedPartIds,
  parts,
  properties,
  onAddPart,
  onDeletePart,
}: {
  // プロトタイプ名
  prototypeName: string;
  // グループID
  groupId: string;
  // プレイヤー
  players: Player[];
  // 選択中のパーツID
  selectedPartId: number | null;
  // 複数選択中のパーツID配列
  selectedPartIds: number[];
  // パーツ
  parts: Part[];
  // パーツのプロパティ
  properties: PartProperty[];
  // パーツを追加時の処理
  onAddPart: ({ part, properties }: AddPartProps) => void;
  // パーツを削除時の処理
  onDeletePart: () => void;
}) {
  // 複数選択されているかどうか（2つ以上のパーツが選択されている場合）
  const isMultipleSelection = selectedPartIds.length > 1;

  return (
    <>
      {/* Left Sidebar */}
      <PartCreateSidebar
        prototypeName={prototypeName}
        groupId={groupId}
        players={players}
        onAddPart={onAddPart}
      />

      {/* ショートカットヘルプパネル */}
      <ShortcutHelpPanel
        shortcuts={[
          {
            id: 'multi-select',
            key: 'Shift + クリック',
            description: '複数のパーツを選択できます',
          },
          {
            id: 'multi-drag',
            key: 'Shift + ドラッグ',
            description: '選択中の複数パーツをまとめて移動できます',
          },
          {
            id: 'delete',
            key: 'Delete / Backspace',
            description: '選択中のパーツを削除します',
          },
        ]}
      />

      {/* Right Sidebar - 複数選択時は非表示 */}
      {!isMultipleSelection && (
        <PartPropertySidebar
          players={players}
          selectedPartId={selectedPartId}
          parts={parts}
          properties={properties}
          onAddPart={onAddPart}
          onDeletePart={onDeletePart}
        />
      )}
    </>
  );
}
