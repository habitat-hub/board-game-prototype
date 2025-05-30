import React, { useState } from 'react';
import { Group, Rect, Text } from 'react-konva';

/**
 * Konvaパーツ用コンテキストメニューのProps
 */
export interface KonvaPartContextMenuProps {
  /**
   * メニューの表示状態
   */
  visible: boolean;
  /**
   * メニューの位置
   */
  position: {
    x: number;
    y: number;
  };
  /**
   * 順序変更のコールバック
   */
  onChangeOrder: (type: 'front' | 'back' | 'frontmost' | 'backmost') => void;
  /**
   * メニューを閉じるコールバック
   */
  onClose: () => void;
}

/**
 * Konvaパーツで使用するコンテキストメニューコンポーネント
 * Part2.tsxの外部に定義された独立したコンポーネント
 */
export const KonvaPartContextMenu: React.FC<KonvaPartContextMenuProps> = ({
  visible,
  position,
  onChangeOrder,
  onClose,
}) => {
  const [hoveredMenuItem, setHoveredMenuItem] = useState<number | null>(null);

  if (!visible) {
    return null;
  }

  // メニュー項目の定義
  const menuItems = [
    {
      id: 0,
      text: '最前面に移動',
      action: () => onChangeOrder('frontmost'),
    },
    {
      id: 1,
      text: '前面に移動',
      action: () => onChangeOrder('front'),
    },
    {
      id: 2,
      text: '背面に移動',
      action: () => onChangeOrder('back'),
    },
    {
      id: 3,
      text: '最背面に移動',
      action: () => onChangeOrder('backmost'),
    },
  ];

  const menuHeight = menuItems.length * 25;

  return (
    <Group
      x={position.x}
      y={position.y}
      name="context-menu-component"
      onClick={(e) => {
        // クリックイベントの伝播を停止
        e.cancelBubble = true;
      }}
    >
      {/* メニュー背景 */}
      <Rect
        width={120}
        height={menuHeight}
        fill="rgba(255, 255, 255, 0.9)"
        stroke="grey"
        strokeWidth={1}
        cornerRadius={4}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowBlur={5}
        shadowOffsetX={1}
        shadowOffsetY={1}
        name="context-menu-component"
      />

      {/* メニュー項目 */}
      <Group name="context-menu-component">
        {menuItems.map((item) => (
          <React.Fragment key={item.id}>
            <Rect
              width={120}
              height={25}
              fill={
                hoveredMenuItem === item.id
                  ? 'rgba(200, 200, 255, 0.5)'
                  : 'transparent'
              }
              y={item.id * 25}
              name="context-menu-component"
            />
            <Text
              text={item.text}
              fontSize={12}
              fill="black"
              padding={8}
              y={item.id * 25}
              width={120}
              name="context-menu-component"
              onMouseEnter={() => setHoveredMenuItem(item.id)}
              onMouseLeave={() => setHoveredMenuItem(null)}
              onClick={() => {
                item.action();
                onClose();
              }}
            />
          </React.Fragment>
        ))}
      </Group>
    </Group>
  );
};
