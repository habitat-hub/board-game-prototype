/**
 * @component ショートカットキーや操作方法を説明するフローティングパネル
 */

'use client';

import { useState, useEffect } from 'react';
import { IoClose, IoInformationCircleOutline } from 'react-icons/io5';

type ShortcutInfo = {
  id: string;
  key: string; // ショートカットキーやアクション
  description: string; // 説明文
};

interface ShortcutHelpPanelProps {
  shortcuts: ShortcutInfo[];
}

export default function ShortcutHelpPanel({
  shortcuts,
}: ShortcutHelpPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // キーボードショートカットのハンドラを追加
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
    <div className="fixed left-[18rem] top-[1.75rem] z-50">
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center rounded-full bg-wood-dark p-1.5 shadow-md hover:bg-wood-darkest transition-all"
          aria-label={
            isExpanded
              ? 'ショートカットヘルプを閉じる'
              : 'ショートカットヘルプを開く'
          }
          title="ショートカット情報 (Shift+?)"
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
                  <tr className="border-b border-wood-light/10">
                    <td className="py-1.5 px-2 font-medium text-wood-dark">
                      Shift + ?
                    </td>
                    <td className="py-1.5 px-2 text-wood-darkest">
                      ショートカットヘルプを開閉する
                    </td>
                  </tr>
                  {shortcuts.map((shortcut) => (
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
