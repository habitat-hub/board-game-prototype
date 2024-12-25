'use client';

import { ReactNode } from 'react';

const TextIconButton = ({
  text,
  icon,
  isSelected,
  onClick,
}: {
  text: string;
  icon: ReactNode;
  isSelected: boolean;
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
