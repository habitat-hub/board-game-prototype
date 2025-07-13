/**
 * @component ショートカットキーや操作方法を説明するフローティングパネル
 */

'use client';

import { useState, useEffect } from 'react';
import { IoClose, IoInformationCircleOutline } from 'react-icons/io5';

type ShortcutInfo = {
  id: string;
  key: string;
  description: string;
};

type PartInfo = {
  id: string;
  name: string;
  description: string;
};

type OperationInfo = {
  id: string;
  operation: string;
  description: string;
};

//ショートカット情報の定義
const SHORTCUTS: ShortcutInfo[] = [
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
const PARTS_INFO: PartInfo[] = [
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
      'プレイヤーの手札エリアを表すパーツ。ルームで所有者を設定できる。',
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
      'ゲーム盤面のエリアを表すパーツ。他のパーツを配置する領域として使用。',
  },
];

// 操作方法の定義
const OPERATIONS_INFO: OperationInfo[] = [
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

export default function GameBoardInstructionPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'shortcuts' | 'parts' | 'operations'
  >('parts');

  // キーボードショートカットのハンドラを追加
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ユーザーが入力中の場合は何もしない
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      // Shift + ? (Shift + / キー)でショートカットメニューを開閉
      if (event.shiftKey && event.key === '?') {
        setIsExpanded((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // クリーンアップ関数
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="fixed left-[20rem] top-[1.75rem] z-50">
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center rounded-full bg-wood-dark p-1.5 shadow-md hover:bg-wood-darkest transition-all"
          aria-label={
            isExpanded ? 'ヘルプパネルを閉じる' : 'ヘルプパネルを開く'
          }
          title="操作ヘルプ (Shift+?)"
        >
          <IoInformationCircleOutline className="h-4 w-4 text-white" />
        </button>

        {isExpanded && (
          <div className="absolute left-0 top-9 w-96 rounded-xl border border-wood-lightest/40 bg-gradient-to-r from-content to-content-secondary shadow-md z-50">
            <div className="relative px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-wood-darkest">
                  ショートカット一覧
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="rounded-md p-1 hover:bg-wood-lightest/20 transition-colors"
                    aria-label="ヘルプを閉じる"
                  >
                    <IoClose className="h-3.5 w-3.5 text-wood-dark hover:text-header transition-colors" />
                  </button>
                </div>
              </div>
              <div className="flex gap-1 mb-2">
                <button
                  onClick={() => setActiveTab('parts')}
                  className={`flex-1 rounded-md py-1 text-center text-xs font-medium transition-all ${
                    activeTab === 'parts'
                      ? 'bg-wood-lightest text-wood-dark'
                      : 'text-wood-darkest hover:bg-wood-lightest/20'
                  }`}
                  aria-label="パーツタブを開く"
                >
                  パーツ
                </button>
                <button
                  onClick={() => setActiveTab('operations')}
                  className={`flex-1 rounded-md py-1 text-center text-xs font-medium transition-all ${
                    activeTab === 'operations'
                      ? 'bg-wood-lightest text-wood-dark'
                      : 'text-wood-darkest hover:bg-wood-lightest/20'
                  }`}
                  aria-label="操作方法タブを開く"
                >
                  操作方法
                </button>
                <button
                  onClick={() => setActiveTab('shortcuts')}
                  className={`flex-1 rounded-md py-1 text-center text-xs font-medium transition-all ${
                    activeTab === 'shortcuts'
                      ? 'bg-wood-lightest text-wood-dark'
                      : 'text-wood-darkest hover:bg-wood-lightest/20'
                  }`}
                  aria-label="ショートカットタブを開く"
                >
                  ショートカット
                </button>
              </div>
              {activeTab === 'parts' && (
                <table className="w-full text-xs">
                  <thead className="border-b border-wood-light/30">
                    <tr>
                      <th className="py-1 px-2 text-left font-medium text-wood-dark w-1/4">
                        パーツ
                      </th>
                      <th className="py-1 px-2 text-left font-medium text-wood-dark">
                        説明
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {PARTS_INFO.map((part) => (
                      <tr
                        key={part.id}
                        className="border-b border-wood-light/10 last:border-b-0"
                      >
                        <td className="py-1.5 px-2 font-medium text-wood-dark">
                          {part.name}
                        </td>
                        <td className="py-1.5 px-2 text-wood-darkest">
                          {part.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {activeTab === 'operations' && (
                <table className="w-full text-xs">
                  <thead className="border-b border-wood-light/30">
                    <tr>
                      <th className="py-1 px-2 text-left font-medium text-wood-dark w-1/3">
                        操作
                      </th>
                      <th className="py-1 px-2 text-left font-medium text-wood-dark">
                        説明
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {OPERATIONS_INFO.map((operation) => (
                      <tr
                        key={operation.id}
                        className="border-b border-wood-light/10 last:border-b-0"
                      >
                        <td className="py-1.5 px-2 font-medium text-wood-dark">
                          {operation.operation}
                        </td>
                        <td className="py-1.5 px-2 text-wood-darkest">
                          {operation.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {activeTab === 'shortcuts' && (
                <table className="w-full text-xs">
                  <thead className="border-b border-wood-light/30">
                    <tr>
                      <th className="py-1 px-2 text-left font-medium text-wood-dark w-1/3">
                        操作
                      </th>
                      <th className="py-1 px-2 text-left font-medium text-wood-dark">
                        説明
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {SHORTCUTS.map((shortcut) => (
                      <tr
                        key={shortcut.id}
                        className="border-b border-wood-light/10 last:border-b-0"
                      >
                        <td className="py-1.5 px-2 font-medium text-wood-dark">
                          {shortcut.key}
                        </td>
                        <td className="py-1.5 px-2 text-wood-darkest">
                          {shortcut.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
