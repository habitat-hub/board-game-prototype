'use client';

import React from 'react';

type MenuItemPropsBase = {
  // メニュー項目のテキスト
  text: string;
};

type ClickableMenuItemProps = MenuItemPropsBase & {
  onClick: () => void;
  href?: never;
};

type LinkMenuItemProps = MenuItemPropsBase & {
  onClick?: never;
  href: string;
};

type MenuItemProps = ClickableMenuItemProps | LinkMenuItemProps;

const MenuItem: React.FC<MenuItemProps> = ({ onClick, href, text }) => {
  const baseClasses =
    'block w-full text-center bg-header-light text-wood-lightest p-2 whitespace-nowrap hover:bg-header hover:text-wood-light transition-all duration-200';

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
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
