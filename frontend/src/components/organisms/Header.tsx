'use client';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';
import { GiWoodenCrate } from 'react-icons/gi';

import UserMenu from '@/components/molecules/UserMenu';
import { useIsPC } from '@/hooks/useIsPC';

const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isPC, isReady } = useIsPC();

  /**
   * トップページへ遷移する
   * 現在すでにトップページにいる場合は何もしない
   */
  const goToTop = () => {
    if (pathname === '/') return;

    router.push('/');
  };

  return (
    <header className="sticky top-0 z-overlay bg-kibako-primary/80 px-8 flex justify-between items-center h-20 backdrop-blur-sm">
      <button onClick={goToTop}>
        <div className="flex gap-2">
          <GiWoodenCrate className="text-4xl drop-shadow-xl transform -rotate-6 text-kibako-white" />
          <span className="text-3xl tracking-wider font-medium text-kibako-white">
            KIBAKO
          </span>
        </div>
      </button>

      {/* PC のみユーザーメニューを表示 */}
      {isReady && isPC && <UserMenu pathname={pathname} />}
    </header>
  );
};

export default Header;
