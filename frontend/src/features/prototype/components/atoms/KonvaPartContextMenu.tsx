import React, { useState } from 'react';
import { Group, Rect, Text } from 'react-konva';

/**
 * Konvaコンテキストメニューのメニューアイテム
 */
export interface KonvaContextMenuItemType {
  /**
   * アイテムのID
   */
  id: string | number;
  /**
   * 表示テキスト
   */
  text: string;
  /**
   * クリック時のアクション
   */
  action: () => void;
}

/**
 * Konva用汎用コンテキストメニューのProps
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
   * メニュー項目の配列
   */
  menuItems: KonvaContextMenuItemType[];
  /**
   * メニューを閉じるコールバック
   */
  onClose: () => void;
  /**
   * メニューの幅（オプション、デフォルト: 120）
   */
  width?: number;
  /**
   * メニュー項目の高さ（オプション、デフォルト: 25）
   */
  itemHeight?: number;
}

/**
 * Konva用汎用コンテキストメニューコンポーネント
 * 任意のメニュー項目を表示できる汎用的なコンポーネント
 */
export const KonvaPartContextMenu: React.FC<KonvaPartContextMenuProps> = ({
  visible,
  position,
  menuItems,
  onClose,
  width = 120,
  itemHeight = 25,
}) => {
  const [hoveredMenuItem, setHoveredMenuItem] = useState<string | number | null>(null);

  if (!visible) {
    return null;
  }

  const menuHeight = menuItems.length * itemHeight;

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
        width={width}
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
        {menuItems.map((item, index) => (
          <React.Fragment key={item.id}>
            <Rect
              width={width}
              height={itemHeight}
              fill={
                hoveredMenuItem === item.id
                  ? 'rgba(200, 200, 255, 0.5)'
                  : 'transparent'
              }
              y={index * itemHeight}
              name="context-menu-component"
            />
            <Text
              text={item.text}
              fontSize={12}
              fill="black"
              padding={8}
              y={index * itemHeight}
              width={width}
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
