'use client';

import React from 'react';

type MenuItemPropsBase = {
  // メニュー項目のテキスト
  text: string;
};

type ClickableMenuItemProps = MenuItemPropsBase & {
  onClick: () => void;
  href?: never;
  openInNewTab?: never;
};

type LinkMenuItemProps = MenuItemPropsBase & {
  onClick?: never;
  href: string;
  // 新しいタブで開くかどうか（デフォルトはtrue）
  openInNewTab?: boolean;
};

type MenuItemProps = ClickableMenuItemProps | LinkMenuItemProps;

const MenuItem: React.FC<MenuItemProps> = ({
  onClick,
  href,
  text,
  openInNewTab = true,
}) => {
  const baseClasses =
    'block w-full text-center bg-header-light text-wood-lightest p-2 whitespace-nowrap hover:bg-header hover:text-wood-light transition-all duration-200';

  if (href) {
    return (
      <a
        href={href}
        target={openInNewTab ? '_blank' : undefined}
        rel={openInNewTab ? 'noopener noreferrer' : undefined}
        className={baseClasses}
      >
        {text}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={baseClasses}>
      {text}
    </button>
  );
};

export default MenuItem;
