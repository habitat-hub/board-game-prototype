/**
 * @component ショートカットキーや操作方法を説明するフローティングパネル
 */

'use client';

import React, { useState, useEffect } from 'react';
import { IoClose, IoInformationCircleOutline } from 'react-icons/io5';

import {
  SHORTCUTS,
  PARTS_INFO,
  OPERATIONS_INFO,
} from '@/features/prototype/constants/helpInfo';
import { isInputFieldFocused } from '@/utils/inputFocus';

export default function GameBoardInstructionPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
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
          className="flex items-center justify-center rounded-full bg-wood-dark p-1.5 shadow-md hover:bg-wood-darkest transition-all"
          aria-label={isExpanded ? 'ヘルプを閉じる' : 'ヘルプを開く'}
          title="操作ヘルプ (Shift+?)"
        >
          <IoInformationCircleOutline className="h-4 w-4 text-white" />
        </button>

        {isExpanded && (
          <div className="absolute left-0 top-9 w-96 rounded-xl border border-wood-lightest/40 bg-gradient-to-r from-content to-content-secondary shadow-md z-50">
            <div className="relative px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-wood-darkest">
                  ヘルプ
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
