'use client';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { GiWoodenCrate } from 'react-icons/gi';

import { WoodenCrateBackground } from '@/features/prototype/components/atoms/WoodenCrateBackground';
import axiosInstance from '@/utils/axiosInstance';

// フッターを非表示にしたいURLパターン
const hideFooterPattern = /^\/prototypes\/[a-f0-9-]+\/versions\/[a-f0-9-]+\//;

interface LayoutProps {
  children: React.ReactNode;
}
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  // ログアウトメニューの表示状態
  const [showLogout, setShowLogout] = useState(false);
  // ユーザー名
  const [userName, setUserName] = useState<string | null>(null);
  // ログアウトメニューのRef
  const logoutRef = useRef(null);
  // フッターと背景画像を表示するか
  const showsFooterAndBackgroundImage = !hideFooterPattern.test(pathname);

  /**
   * ユーザー名を更新する
   */
  const updateUserName = useCallback(() => {
    const user = localStorage.getItem('user');
    // ユーザー情報が存在しない場合
    if (!user) {
      setUserName(null);
      return;
    }
    setUserName(JSON.parse(user).username);
  }, []);

  // ヘッダーにユーザー名を表示する
  useEffect(() => {
    updateUserName();
    window.addEventListener('userUpdated', updateUserName);
    return () => {
      window.removeEventListener('userUpdated', updateUserName);
    };
  }, [updateUserName, pathname]);

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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    axiosInstance
      .post(`${apiUrl}/auth/logout`)
      .then(() => {
        localStorage.removeItem('user'); // ログアウト時にユーザー情報を削除
        window.dispatchEvent(new Event('userUpdated')); // カスタムイベントを発火
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
        {userName && pathname !== '/' && (
          <div className="relative" ref={logoutRef}>
            <button
              onClick={() => setShowLogout(!showLogout)}
              className="hover:text-wood-light transition-colors duration-200"
            >
              {userName}
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
