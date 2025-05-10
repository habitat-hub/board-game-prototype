'use client';

import { ReactNode } from 'react';

const TextIconButton = ({
  text,
  icon,
  isSelected = false,
  disabled = false,
  onClick,
}: {
  // ボタンのテキスト
  text: string;
  // ボタンのアイコン
  icon: ReactNode;
  // ボタンが選択されているか
  isSelected?: boolean;
  // ボタンが無効化されているか
  disabled?: boolean;
  // ボタンをクリックしたときの処理
  onClick: () => void;
}) => {
  return (
    <button
      className={`flex items-center gap-2 rounded px-1.5 py-1 text-left text-xs hover:bg-gray-200 ${
        isSelected ? 'bg-[#bce3ff]' : ''
      } ${
        disabled ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
};

export default TextIconButton;
