import React from 'react';
import { MdPanTool } from 'react-icons/md';

interface ModeToggleButtonProps {
  isSelectionMode: boolean;
  onToggle: () => void;
}

export default function ModeToggleButton({
  isSelectionMode,
  onToggle,
}: ModeToggleButtonProps) {
  return (
    <div className="absolute bottom-4 left-4 z-50 flex flex-col gap-2">
      <div className="relative group">
        <button
          className={`relative p-3 rounded-full shadow-md transition-all duration-300 ${
            !isSelectionMode
              ? 'bg-kibako-primary text-kibako-white ring-2 ring-kibako-accent ring-offset-2 shadow-lg'
              : 'bg-gray-300 text-gray-500 hover:bg-gray-400'
          }`}
          onClick={onToggle}
          aria-label="Toggle Pan Mode"
        >
          <MdPanTool
            className={`w-6 h-6 transition-transform duration-300 ${
              !isSelectionMode ? 'scale-110' : 'scale-100'
            }`}
          />
        </button>
        {/* ツールチップ */}
        <div className="absolute left-0 bottom-full mb-1 bg-header text-kibako-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[200]">
          {!isSelectionMode
            ? 'ボードをドラッグ&ドロップで移動できるモードをオフにする'
            : 'ボードをドラッグ&ドロップで移動できるモードをオンにする'}
        </div>
      </div>
    </div>
  );
}
