'use client';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';
import { GiWoodenCrate } from 'react-icons/gi';

import HeaderRightMenu from '@/components/HeaderRightMenu';

interface HeaderProps {
  height: number;
}

const Header: React.FC<HeaderProps> = ({ height }) => {
  const router = useRouter();
  const pathname = usePathname();

  /**
   * プロトタイプ一覧画面へ遷移する
   * 現在すでにプロトタイプ一覧画面またはログイン画面にいる場合は何もしない
   */
  const goToPrototypes = () => {
    // プロトタイプ一覧画面、またはログイン画面の場合
    if (pathname === '/prototypes' || pathname === '/') return;

    router.push('/prototypes');
  };

  return (
    <header
      className="bg-gradient-to-r from-amber-600 to-amber-800 text-white p-4 flex justify-between items-center shadow-md"
      style={{ height: `${height}px` }}
    >
      <button
        onClick={goToPrototypes}
        className="text-lg font-bold p-2 rounded hover:text-amber-200 transition-all duration-200 flex items-center gap-3"
      >
        <div className="flex items-center gap-2">
          <GiWoodenCrate className="text-3xl drop-shadow-lg transform -rotate-6 text-amber-50" />
          <span className="text-2xl tracking-wider font-light">KIBAKO</span>
        </div>
      </button>

      <HeaderRightMenu pathname={pathname} />
    </header>
  );
};

export default Header;
