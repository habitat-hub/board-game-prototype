import React, { useState, useEffect, useRef } from 'react';

/**
 * HTML版コンテキストメニューのProps
 */
export interface ProjectContextMenuProps {
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
   * メニューの幅（デフォルト: 120px）
   */
  width?: number;
  /**
   * 各メニューアイテムの高さ（デフォルト: 25px）
   */
  itemHeight?: number;
  /**
   * メニュー項目の定義
   */
  items: {
    id: string;
    text: string;
    action: () => void;
    icon?: React.ReactNode;
    danger?: boolean;
  }[];
  /**
   * メニューを閉じるコールバック
   */
  onClose: () => void;
}

/**
 * HTML版コンテキストメニューコンポーネント
 * ProjectListなどのHTML/CSSコンポーネントで使用
 */
export const ProjectContextMenu: React.FC<ProjectContextMenuProps> = ({
  visible,
  position,
  width = 120,
  itemHeight = 25,
  items,
  onClose,
}) => {
  const [hoveredMenuItem, setHoveredMenuItem] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // メニューの高さを計算
  const menuHeight = items.length * itemHeight;

  // 外部クリック時にメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [visible, onClose]);

  // ESCキーでメニューを閉じる
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [visible, onClose]);

  if (!visible) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="absolute bg-white border border-gray-200 rounded-lg shadow-lg py-1"
      style={{
        left: position.x + window.scrollX,
        top: position.y + window.scrollY,
        width: `${width}px`,
        height: `${menuHeight + 8}px`, // py-1 (上下4pxずつ) を考慮
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item) => (
        <button
          key={item.id}
          className={`w-full px-4 text-left flex items-center gap-2 transition-colors ${
            hoveredMenuItem === item.id
              ? 'bg-gray-100'
              : 'hover:bg-gray-100'
          } ${
            item.danger
              ? 'text-red-600 hover:text-red-700'
              : 'text-gray-700 hover:text-gray-900'
          }`}
          style={{
            height: `${itemHeight}px`,
            fontSize: `${itemHeight * 0.5}px`,
          }}
          onMouseEnter={() => setHoveredMenuItem(item.id)}
          onMouseLeave={() => setHoveredMenuItem(null)}
          onClick={() => {
            item.action();
            onClose();
          }}
        >
          {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
          <span>{item.text}</span>
        </button>
      ))}
    </div>
  );
}; 