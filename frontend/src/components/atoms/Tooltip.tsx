'use client';

import { ReactNode, useState } from 'react';

export default function Tooltip({
  children,
  text,
  position = 'top',
}: {
  // ツールチップを表示する要素
  children: ReactNode;
  // ツールチップのテキスト
  text: string;
  // ツールチップの表示位置
  position?: 'top' | 'bottom' | 'left' | 'right';
}) {
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  // ツールチップの位置をリセット
  const resetTooltipStyle = () => {
    setTooltipStyle({});
  };

  // ポジションに応じた初期スタイルクラス
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1',
  };

  // ツールチップの位置を調整する
  const adjustTooltipPosition = (event: React.MouseEvent<HTMLDivElement>) => {
    const tooltip = event.currentTarget.querySelector('.tooltip-content');
    if (!tooltip) return;

    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const newStyle: React.CSSProperties = {};
    
    // 画面右端からはみ出す場合
    if (tooltipRect.right > viewportWidth - 10) {
      newStyle.right = '0';
      newStyle.left = 'auto';
      newStyle.transform = 'none';
    }
    
    // 画面左端からはみ出す場合
    if (tooltipRect.left < 10) {
      newStyle.left = '0';
      newStyle.right = 'auto';
      newStyle.transform = 'none';
    }
    
    // 画面上端からはみ出す場合
    if (tooltipRect.top < 10) {
      if (position === 'top') {
        newStyle.bottom = 'auto';
        newStyle.top = '100%';
        newStyle.marginTop = '4px';
        newStyle.marginBottom = '0';
      }
    }
    
    // 画面下端からはみ出す場合
    if (tooltipRect.bottom > viewportHeight - 10) {
      if (position === 'bottom') {
        newStyle.top = 'auto';
        newStyle.bottom = '100%';
        newStyle.marginBottom = '4px';
        newStyle.marginTop = '0';
      }
    }
    
    setTooltipStyle(newStyle);
  };

  return (
    <div 
      className="group relative inline-block"
      onMouseEnter={adjustTooltipPosition}
      onMouseLeave={resetTooltipStyle}
    >
      {children}
      <div
        className={`tooltip-content absolute hidden min-w-max max-w-[200px] rounded bg-gray-800 px-2 py-1 text-xs text-white break-words group-hover:block z-50 ${positionClasses[position]}`}
        style={tooltipStyle}
      >
        {text}
      </div>
    </div>
  );
} 