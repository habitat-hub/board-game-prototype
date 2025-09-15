import React from 'react';
import { MdPanTool } from 'react-icons/md';
import { PiRectangleDashedDuotone } from 'react-icons/pi';

import KibakoToggle from '@/components/atoms/KibakoToggle';

interface SelectionModeToggleButtonProps {
  isSelectionMode: boolean;
  onToggle: () => void;
}

export default function SelectionModeToggleButton({
  isSelectionMode,
  onToggle,
}: SelectionModeToggleButtonProps) {
  const panHelp = 'ボード上をドラッグで移動';
  const selectHelp = 'ボード上でドラッグしてパーツを選択';

  const TooltipIcon = ({
    children,
    text,
  }: {
    children: React.ReactNode;
    text: string;
  }) => (
    <span className="relative inline-flex items-center justify-center group">
      {children}
      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-kibako-primary text-kibako-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        {text}
      </div>
    </span>
  );

  return (
    <div className="flex flex-col items-end gap-1">
      <KibakoToggle
        checked={isSelectionMode}
        onChange={(next) => next !== isSelectionMode && onToggle()}
        ariaLabel={isSelectionMode ? '選択モード' : 'パンモード'}
        labelLeft={
          <TooltipIcon text={panHelp}>
            <MdPanTool className="h-4 w-4" />
          </TooltipIcon>
        }
        labelRight={
          <TooltipIcon text={selectHelp}>
            <PiRectangleDashedDuotone className="h-4 w-4" />
          </TooltipIcon>
        }
        shouldChangeBackground={false}
        className="gap-1"
      />
    </div>
  );
}
