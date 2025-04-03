'use client';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState, useRef } from 'react';
import { GiWoodenCrate } from 'react-icons/gi';

import { useAuth } from '@/api/hooks/useAuth';
import { WoodenCrateBackground } from '@/features/prototype/components/atoms/WoodenCrateBackground';
import { useUser } from '@/hooks/useUser';
// フッターを非表示にしたいURLパターン
const hideFooterPattern = /^\/prototypes\/[a-f0-9-]+\/versions\/[a-f0-9-]+\//;

interface LayoutProps {
  children: React.ReactNode;
}
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  const { user } = useUser();
  const { logout } = useAuth();

  // ログアウトメニューの表示状態
  const [showLogout, setShowLogout] = useState(false);
  // ログアウトメニューのRef
  const logoutRef = useRef(null);
  // フッターと背景画像を表示するか
  const showsFooterAndBackgroundImage = !hideFooterPattern.test(pathname);

  /**
   * ログアウトボタンの外側をクリックしたらログアウトボタンを非表示にする
   */
  const handleClickLogoutOutside = (event: MouseEvent) => {
    // Refが存在しない、またはRefが存在してもクリックされた要素がRefの要素の場合（この場合ログアウト処理が走る）
    if (
      !logoutRef.current ||
      (logoutRef.current as HTMLElement).contains(event.target as Node)
    )
      return;

    setShowLogout(false);
  };

  // ログアウトメニュー表示時のクリックイベントハンドラー登録
  useEffect(() => {
    document.addEventListener('mousedown', handleClickLogoutOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickLogoutOutside);
    };
  }, [logoutRef]);

  /**
   * ログアウトする
   */
  const handleLogout = () => {
    logout()
      .then(() => {
        router.replace('/');
      })
      .catch((error) => console.error('Logout error:', error));
  };

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
    <div className="h-screen">
      <header
        className="bg-header text-wood-lightest p-4 flex justify-between items-center shadow-md"
        style={{ height: '48px' }}
      >
        <button
          onClick={goToPrototypes}
          className="text-lg font-bold p-2 rounded hover:opacity-90 transition-all duration-200"
        >
          <div className="flex items-center gap-2">
            <GiWoodenCrate className="text-3xl drop-shadow-lg transform -rotate-6 from-wood-light to-wood-dark bg-wood-grain text-wood-lightest hover:from-wood-lightest hover:to-wood-dark transition-all duration-300" />
            <span className="text-2xl tracking-wider font-light">KIBAKO</span>
          </div>
        </button>
        {user?.username && pathname !== '/' && (
          <div className="relative" ref={logoutRef}>
            <button
              onClick={() => setShowLogout(!showLogout)}
              className="hover:text-wood-light transition-colors duration-200"
            >
              {user.username}
            </button>
            {showLogout && (
              <button
                onClick={handleLogout}
                className="absolute right-0 mt-2 bg-header-light text-wood-lightest p-2 rounded shadow-lg whitespace-nowrap hover:bg-header hover:text-wood-light transition-all duration-200"
                style={{ minWidth: '80px', top: '100%' }}
              >
                ログアウト
              </button>
            )}
          </div>
        )}
      </header>
      <main
        className="bg-content px-6 md:px-12 lg:px-24 overflow-auto"
        style={{
          height: `calc(100vh - ${showsFooterAndBackgroundImage ? '80px' : '48px'})`,
        }}
      >
        <div className="max-w-7xl mx-auto h-full">
          {showsFooterAndBackgroundImage && <WoodenCrateBackground />}
          {children}
        </div>
      </main>
      {showsFooterAndBackgroundImage && (
        <footer
          className="bg-header text-wood-lightest p-2 text-center text-sm"
          style={{ height: '32px' }}
        >
          &copy; 2024 Code-Son All rights reserved.
        </footer>
      )}
    </div>
  );
};
export default Layout;
