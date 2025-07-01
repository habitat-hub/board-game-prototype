import React from 'react';
import { Rect } from 'react-konva';

interface SelectionRectProps {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

export default function SelectionRect({
  x,
  y,
  width,
  height,
  visible,
}: SelectionRectProps) {
  if (!visible) return null;

  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="rgba(0, 120, 255, 0.15)"
      stroke="#0078ff"
      strokeWidth={1}
      dash={[4, 2]}
      listening={false}
    />
  );
}
