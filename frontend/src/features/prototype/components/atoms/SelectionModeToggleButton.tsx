import React from 'react';
import { MdPanTool } from 'react-icons/md';
import { PiRectangleDashedDuotone } from 'react-icons/pi';

import KibakoToggle from '@/components/atoms/KibakoToggle';

// ツールチップ付きアイコンのProps
type TooltipIconProps = { children: React.ReactNode; text: string };

/**
 * アイコンにツールチップを表示する軽量コンポーネント
 * @param props ツールチップのテキストと子要素
 * @returns ツールチップ付きのアイコン要素
 */
const TooltipIcon = ({
  children,
  text,
}: TooltipIconProps): React.ReactElement => (
  <span className="relative inline-flex items-center justify-center group">
    {children}
    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-kibako-primary text-kibako-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
      {text}
    </div>
  </span>
);

interface SelectionModeToggleButtonProps {
  isSelectionMode: boolean;
  onToggle: () => void;
}

export default function SelectionModeToggleButton({
  isSelectionMode,
  onToggle,
}: SelectionModeToggleButtonProps) {
  // パン操作のツールチップ文言
  const PAN_HELP: string = 'ボード上をドラッグで移動';
  // 矩形選択のツールチップ文言
  const SELECT_HELP: string = 'ボード上でドラッグしてパーツを選択';

  return (
    <div className="flex flex-col items-end gap-1">
      <KibakoToggle
        checked={isSelectionMode}
        onChange={(next) => next !== isSelectionMode && onToggle()}
        ariaLabel={isSelectionMode ? '選択モード' : 'パンモード'}
        labelLeft={
          <TooltipIcon text={PAN_HELP}>
            <MdPanTool className="h-4 w-4" />
          </TooltipIcon>
        }
        labelRight={
          <TooltipIcon text={SELECT_HELP}>
            <PiRectangleDashedDuotone className="h-4 w-4" />
          </TooltipIcon>
        }
        shouldChangeBackground={false}
        className="gap-1"
      />
    </div>
  );
}
