'use client';

import React from 'react';
import { TbVersions } from 'react-icons/tb';

interface CreateVersionButtonProps {
  onClick: () => void;
}

const CreateVersionButton: React.FC<CreateVersionButtonProps> = ({
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      aria-label="プロトタイプバージョン作成"
      className="cursor-pointer w-full"
    >
      <div className="bg-white rounded-xl overflow-visible shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-dashed border-wood-light/60 group w-full">
        <div className="flex items-center justify-center p-4">
          <div className="w-12 h-12 rounded-full bg-wood-lightest/50 flex items-center justify-center mr-4 group-hover:bg-wood-lightest transition-colors">
            <TbVersions className="h-6 w-6 text-wood-dark group-hover:text-header transition-colors" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm text-wood-dark/70 group-hover:text-header/80 transition-colors">
              新しいバージョン
            </span>
            <span className="font-medium text-wood-dark group-hover:text-header transition-colors">
              今のプロトタイプを保存
            </span>
            <p className="text-xs mt-1 max-w-md text-wood-dark/70 group-hover:text-header/70 transition-colors">
              <span className="inline-block mr-1">💡</span>
              プレイルームを作成するには、まず今のプロトタイプを保存します
            </p>
          </div>
        </div>
      </div>
    </button>
  );
};

export default CreateVersionButton;
