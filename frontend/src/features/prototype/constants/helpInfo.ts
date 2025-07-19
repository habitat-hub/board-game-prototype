/**
 * ヘルプ情報に関する定数
 */

import type {
  ShortcutInfo,
  PartInfo,
  OperationInfo,
} from '@/features/prototype/types/helpInfo';

// ショートカット情報の定義
export const SHORTCUTS: ShortcutInfo[] = [
  {
    id: 'help',
    key: 'Shift + ?',
    description: 'ショートカットヘルプを開閉する。',
  },
  {
    id: 'multi-select',
    key: 'Shift + クリック',
    description: '複数のパーツを選択する。',
  },
  {
    id: 'delete',
    key: 'Delete / Backspace',
    description: '選択中の全てのパーツを削除する。',
  },
];

// パーツ操作情報の定義
export const PARTS_INFO: PartInfo[] = [
  {
    id: 'card',
    name: 'カード',
    description:
      'カードを表すパーツ。ダブルクリックで裏返せる。ドラッグで移動可能。ルームで移動時は自動で最前面へ。',
  },
  {
    id: 'token',
    name: 'トークン',
    description:
      'ゲーム内の駒やマーカーを表すパーツ。ドラッグで移動可能。ルームで移動時は自動で最前面へ。',
  },
  {
    id: 'hand',
    name: '手札',
    description:
      'プレイヤーの手札エリアを表すパーツ。ルームで所有者を設定できる。プレイモードでは移動できない。',
  },
  {
    id: 'deck',
    name: '山札',
    description:
      'カードの山札を表すパーツ。ダブルクリックで上にあるパーツをシャッフルできる。',
  },
  {
    id: 'area',
    name: 'エリア',
    description:
      'ゲーム盤面のエリアを表すパーツ。他のパーツを配置する領域として使用。プレイモードでは移動できない。',
  },
];

// 操作方法の定義
export const OPERATIONS_INFO: OperationInfo[] = [
  {
    id: 'drag-drop-part',
    operation: 'ドラッグ&ドロップ(パーツ上)',
    description: 'パーツを移動',
  },
  {
    id: 'drag-drop-other',
    operation: 'ドラッグ&ドロップ(パーツ以外)',
    description: '矩形選択 or ボードを移動。左下でモードを切り替えられる。',
  },
];
