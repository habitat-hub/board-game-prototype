'use client';

import { ReactNode } from 'react';

const TextIconButton = ({
  text,
  icon,
  isSelected = false,
  onClick,
}: {
  // ボタンのテキスト
  text: string;
  // ボタンのアイコン
  icon: ReactNode;
  // ボタンが選択されているか
  isSelected?: boolean;
  // ボタンをクリックしたときの処理
  onClick: () => void;
}) => {
  return (
    <button
      className={`flex items-center gap-2 rounded px-1.5 py-1 text-left text-xs hover:bg-gray-200 ${
        isSelected ? 'bg-[#bce3ff]' : ''
      }`}
      onClick={onClick}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
};

export default TextIconButton;
