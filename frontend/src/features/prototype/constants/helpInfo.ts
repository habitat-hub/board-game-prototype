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
    description: 'ヘルプパネルを開閉する。',
  },
  {
    id: 'space-drag',
    key: 'Space + ドラッグ',
    description: '選択モード時に一時的にゲームボードを移動する。',
  },
  {
    id: 'multi-select',
    key: 'Shift + クリック',
    description: '複数のパーツを選択する。',
  },
  {
    id: 'delete',
    key: 'Delete / Backspace',
    description: '選択中のパーツを全て削除する。',
  },
  {
    id: 'duplicate',
    key: 'Cmd/Ctrl + D',
    description: '選択中のパーツ1つを複製する。',
  },
  {
    id: 'zoom',
    key: 'Cmd/Ctrl + ホイール',
    description: 'ボードを拡大縮小する。',
  },
];

// パーツ操作情報の定義
export const PARTS_INFO: PartInfo[] = [
  {
    id: 'card',
    name: 'カード',
    description:
      'カードを表すパーツ。ダブルクリックで裏返せる。ドラッグで移動できる。プレイルームで移動すると自動で最前面に表示される。',
  },
  {
    id: 'token',
    name: 'トークン',
    description:
      'ゲーム内の駒やマーカーを表すパーツ。ドラッグで移動できる。プレイルームで移動すると自動で最前面に表示される。',
  },
  {
    id: 'hand',
    name: '手札',
    description:
      'プレイヤーの手札エリアを表すパーツ。プレイルームで所有者を設定できる。',
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
      'ゲーム盤面のエリアを表すパーツ。他のパーツを配置する領域として使用する。プレイルームでは移動できない。',
  },
];

// 操作方法の定義
export const OPERATIONS_INFO: OperationInfo[] = [
  {
    id: 'drag-drop-part',
    operation: 'ドラッグ&ドロップ(パーツ上)',
    description: 'パーツを移動する。',
  },
  {
    id: 'drag-drop-other',
    operation: 'ドラッグ&ドロップ(パーツ以外)',
    description:
      '矩形選択またはボードを移動する。左下でモードを切り替えられる。',
  },
];
