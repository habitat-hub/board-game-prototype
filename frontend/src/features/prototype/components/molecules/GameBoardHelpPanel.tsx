/**
 * @component ショートカットキーや操作方法を説明するフローティングパネル
 */

'use client';

import { useState, useEffect } from 'react';
import { IoClose, IoInformationCircleOutline } from 'react-icons/io5';

import {
  SHORTCUTS,
  PARTS_INFO,
  OPERATIONS_INFO,
} from '@/features/prototype/constants/helpInfo';
import { isInputFieldFocused } from '@/utils/inputFocus';

interface GameBoardHelpPanelProps {
  defaultExpanded?: boolean;
}

export default function GameBoardHelpPanel({
  defaultExpanded = false,
}: GameBoardHelpPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  useEffect(() => {
    setIsExpanded(defaultExpanded);
  }, [defaultExpanded]);
  const [activeTab, setActiveTab] = useState<
    'shortcuts' | 'parts' | 'operations'
  >('parts');

  // キーボードショートカットのハンドラを追加
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ユーザーが入力中の場合は何もしない
      if (isInputFieldFocused()) {
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
          className="flex items-center justify-center rounded-full bg-kibako-primary p-1.5 shadow-md hover:bg-kibako-primary transition-all"
          aria-label={isExpanded ? 'ヘルプを閉じる' : 'ヘルプを開く'}
          title="操作ヘルプ (Shift+?)"
        >
          <IoInformationCircleOutline className="h-4 w-4 text-kibako-white" />
        </button>

        {isExpanded && (
          <div className="absolute left-0 top-9 w-96 rounded-xl border border-kibako-tertiary/40 bg-gradient-to-r from-kibako-white to-kibako-tertiary shadow-md z-50">
            <div className="relative px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-kibako-primary">
                  ヘルプ
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="rounded-md p-1 hover:bg-kibako-tertiary/20 transition-colors"
                    aria-label="ヘルプを閉じる"
                  >
                    <IoClose className="h-3.5 w-3.5 text-kibako-primary hover:text-kibako-primary transition-colors" />
                  </button>
                </div>
              </div>
              <div className="flex gap-1 mb-2">
                <button
                  onClick={() => setActiveTab('parts')}
                  className={`flex-1 rounded-md py-1 text-center text-xs font-medium transition-all ${
                    activeTab === 'parts'
                      ? 'bg-kibako-tertiary text-kibako-primary'
                      : 'text-kibako-primary hover:bg-kibako-tertiary/20'
                  }`}
                  aria-label="パーツタブを開く"
                >
                  パーツ
                </button>
                <button
                  onClick={() => setActiveTab('operations')}
                  className={`flex-1 rounded-md py-1 text-center text-xs font-medium transition-all ${
                    activeTab === 'operations'
                      ? 'bg-kibako-tertiary text-kibako-primary'
                      : 'text-kibako-primary hover:bg-kibako-tertiary/20'
                  }`}
                  aria-label="操作方法タブを開く"
                >
                  操作方法
                </button>
                <button
                  onClick={() => setActiveTab('shortcuts')}
                  className={`flex-1 rounded-md py-1 text-center text-xs font-medium transition-all ${
                    activeTab === 'shortcuts'
                      ? 'bg-kibako-tertiary text-kibako-primary'
                      : 'text-kibako-primary hover:bg-kibako-tertiary/20'
                  }`}
                  aria-label="ショートカットタブを開く"
                >
                  ショートカット
                </button>
              </div>
              {activeTab === 'parts' && (
                <table className="w-full text-xs">
                  <thead className="border-b border-kibako-secondary/30">
                    <tr>
                      <th className="py-1 px-2 text-left font-medium text-kibako-primary w-1/4">
                        パーツ
                      </th>
                      <th className="py-1 px-2 text-left font-medium text-kibako-primary">
                        説明
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {PARTS_INFO.map((part) => (
                      <tr
                        key={part.id}
                        className="border-b border-kibako-secondary/10 last:border-b-0"
                      >
                        <td className="py-1.5 px-2 font-medium text-kibako-primary">
                          {part.name}
                        </td>
                        <td className="py-1.5 px-2 text-kibako-primary">
                          {part.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {activeTab === 'operations' && (
                <table className="w-full text-xs">
                  <thead className="border-b border-kibako-secondary/30">
                    <tr>
                      <th className="py-1 px-2 text-left font-medium text-kibako-primary w-1/3">
                        操作
                      </th>
                      <th className="py-1 px-2 text-left font-medium text-kibako-primary">
                        説明
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {OPERATIONS_INFO.map((operation) => (
                      <tr
                        key={operation.id}
                        className="border-b border-kibako-secondary/10 last:border-b-0"
                      >
                        <td className="py-1.5 px-2 font-medium text-kibako-primary">
                          {operation.operation}
                        </td>
                        <td className="py-1.5 px-2 text-kibako-primary">
                          {operation.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {activeTab === 'shortcuts' && (
                <table className="w-full text-xs">
                  <thead className="border-b border-kibako-secondary/30">
                    <tr>
                      <th className="py-1 px-2 text-left font-medium text-kibako-primary w-1/3">
                        操作
                      </th>
                      <th className="py-1 px-2 text-left font-medium text-kibako-primary">
                        説明
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {SHORTCUTS.map((shortcut) => (
                      <tr
                        key={shortcut.id}
                        className="border-b border-kibako-secondary/10 last:border-b-0"
                      >
                        <td className="py-1.5 px-2 font-medium text-kibako-primary">
                          {shortcut.key}
                        </td>
                        <td className="py-1.5 px-2 text-kibako-primary">
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
