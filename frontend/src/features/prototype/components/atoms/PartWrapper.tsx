import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { AllPart } from '@/features/prototype/type';

interface PartWrapperProps {
  part: AllPart;
  order: number;
  customClassName?: string;
  customStyle?: React.CSSProperties;
  children: React.ReactNode;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onDragStart: React.DragEventHandler<HTMLDivElement>;
}

const TOOLTIP_WIDTH = 100;
const TOOLTIP_HEIGHT = 100;

const PartWrapper: React.FC<PartWrapperProps> = ({
  part,
  order,
  customClassName,
  customStyle,
  children,
  onClick,
  onDoubleClick,
  onDragStart,
}) => {
  const defaultTooltipPosition = useMemo(() => {
    return {
      x: part.position.x + part.width + TOOLTIP_WIDTH,
      y: part.position.y + part.height + TOOLTIP_HEIGHT,
    };
  }, [part]);

  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    text: string;
  }>({
    visible: false,
    x: defaultTooltipPosition.x,
    y: defaultTooltipPosition.y,
    text: '',
  });

  let hoverTimeout: NodeJS.Timeout;

  const handleMouseEnter = (e: React.MouseEvent, description: string) => {
    hoverTimeout = setTimeout(() => {
      setTooltip({
        visible: true,
        x: defaultTooltipPosition.x,
        y: defaultTooltipPosition.y,
        text: description,
      });
    }, 1000); // 0.5秒後にツールチップを表示
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout);
    setTooltip({
      visible: false,
      x: defaultTooltipPosition.x,
      y: defaultTooltipPosition.y,
      text: '',
    });
  };

  return (
    <>
      <div
        draggable
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onDragStart={onDragStart}
        onMouseEnter={(e) => handleMouseEnter(e, part.description)}
        onMouseLeave={handleMouseLeave}
        className={clsx(
          'absolute cursor-move border border-gray-300 rounded p-2 shadow-sm text-xs',
          customClassName
        )}
        style={{
          left: part.position.x,
          top: part.position.y,
          width: part.width,
          height: part.height,
          backgroundColor: part.color || 'white',
          zIndex: order,
          overflow: 'hidden',
          whiteSpace: 'normal',
          textOverflow: 'ellipsis',
          ...customStyle,
        }}
      >
        {children}
      </div>
      {tooltip.visible && (
        <div
          className="absolute bottom-0 left-0 bg-white text-[10px] rounded border border-gray-300 p-1"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            width: TOOLTIP_WIDTH,
            height: TOOLTIP_HEIGHT,
            transform: 'translate(-120%, -120%)',
            zIndex: 1000,
            overflow: 'hidden',
            whiteSpace: 'normal',
            textOverflow: 'ellipsis',
          }}
        >
          {tooltip.text || '（説明がありません）'}
        </div>
      )}
    </>
  );
};

export default PartWrapper;
