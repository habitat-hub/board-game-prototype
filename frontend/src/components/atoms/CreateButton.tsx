'use client';

import { ReactNode } from 'react';

const CreateButton = ({
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
      className={`flex items-center gap-2 rounded px-1.5 py-1 text-left text-[11px] hover:bg-gray-100 ${
        isSelected ? 'bg-[#bce3ff]' : ''
      }`}
      onClick={onClick}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
};

export default CreateButton;
