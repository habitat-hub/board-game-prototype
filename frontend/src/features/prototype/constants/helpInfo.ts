/**
 * ヘルプ情報に関する定数
 */

import type {
  PartInfo,
  OperationInfo,
} from '@/features/prototype/types/helpInfo';
export { SHORTCUTS } from './shortcutKeys';

// パーツ操作情報の定義
export const PARTS_INFO: PartInfo[] = [
  {
    id: 'card',
    name: 'カード',
    description:
      'カードを表すパーツ。ダブルクリックで裏返せる。ドラッグで移動できる。プレイルームで移動すると自動で最前面に表示される。複数のカードを選択して裏向きでシャッフルすることもできる。',
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
      'プレイヤーの手札エリアを表すパーツ。プレイルームで所有者を設定できる。手札に所有者を設定すると、その手札上のカードの表側は所有者だけに見えるようになる。',
  },
  {
    id: 'area',
    name: 'エリア',
    description: 'ゲーム盤面のエリアを表すパーツ。',
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
      '矩形選択（薄い水色の長方形による選択）する、または、ボードを移動する。左下でモードを切り替えられる。',
  },
];
