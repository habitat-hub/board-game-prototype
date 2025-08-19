'use client';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';
import { GiWoodenCrate } from 'react-icons/gi';

import HeaderRightMenu from '@/components/molecules/HeaderRightMenu';

const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  /**
   * プロジェクト一覧画面へ遷移する
   * 現在すでにプロジェクト一覧画面またはログイン画面にいる場合は何もしない
   */
  const goToProjects = () => {
    // プロジェクト一覧画面、またはログイン画面の場合
    if (pathname === '/projects' || pathname === '/') return;

    router.push('/projects');
  };

  return (
    <header className="sticky top-0 z-40 bg-kibako-primary/80 px-8 flex justify-between items-center h-20 backdrop-blur-sm">
      <button onClick={goToProjects}>
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
