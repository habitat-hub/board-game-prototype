'use client';

import React from 'react';

type MenuItemProps = {
  // クリックしたときの処理（hrefと排他的に使用する必要がある）
  onClick?: () => void;
  // リンク先URL（onClickと排他的に使用する必要がある）
  href?: string;
  // メニュー項目のテキスト
  text: string;
};

const MenuItem: React.FC<MenuItemProps> = ({ onClick, href, text }) => {
  // propsのバリデーション: onClickかhrefのどちらか一方のみが提供されている必要があります
  if ((!onClick && !href) || (onClick && href)) {
    throw new Error(
      '[Developer Error] MenuItem: Either onClick or href must be provided, but not both.'
    );
  }

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
