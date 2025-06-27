'use client';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';
import { GiWoodenCrate } from 'react-icons/gi';

import HeaderRightMenu from '@/components/molecules/HeaderRightMenu';

const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  /**
   * プロトタイプ一覧画面へ遷移する
   * 現在すでにプロトタイプ一覧画面またはログイン画面にいる場合は何もしない
   */
  const goToPrototypes = () => {
    // プロトタイプ一覧画面、またはログイン画面の場合
    if (pathname === '/groups' || pathname === '/') return;

    router.push('/groups');
  };

  return (
    <header className="bg-kibako-primary text-white p-6 flex justify-between items-center h-20">
      <button onClick={goToPrototypes}>
        <div className="flex gap-2">
          <GiWoodenCrate className="text-4xl drop-shadow-xl transform -rotate-6 text-kibako-white" />
          <span className="text-3xl tracking-wider font-medium text-kibako-white">
            KIBAKO
          </span>
        </div>
      </button>

      <HeaderRightMenu pathname={pathname} />
    </header>
  );
};

export default Header;
