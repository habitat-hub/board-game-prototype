'use client';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState, useRef } from 'react';

import axiosInstance from '@/utils/axiosInstance';
interface LayoutProps {
  children: React.ReactNode;
}
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showLogout, setShowLogout] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const logoutRef = useRef(null);
  // ヘッダーにユーザー名を表示する
  useEffect(() => {
    const updateUserName = () => {
      const user = localStorage.getItem('user');
      if (user) {
        setUserName(JSON.parse(user).username);
      } else {
        setUserName(null);
      }
    };
    updateUserName();
    window.addEventListener('userUpdated', updateUserName);
    return () => {
      window.removeEventListener('userUpdated', updateUserName);
    };
  }, [pathname]);
  // ログアウトエリアの外側をクリックしたらログアウトボタンを非表示にする
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        logoutRef.current &&
        !(logoutRef.current as HTMLElement).contains(event.target as Node)
      ) {
        setShowLogout(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
  // 非表示にしたいURLパターン
  const hideFooterPattern = /^\/prototypes\/[a-f0-9-]+\/versions\/[a-f0-9-]+\//;
  // 現在のパスが非表示パターンにマッチするか確認
  const shouldHideFooter = hideFooterPattern.test(pathname);

  return (
    <div className="h-screen">
      <header
        className="bg-blue-600 text-white p-4 flex justify-between items-center"
        style={{ height: '48px' }}
      >
        <button
          onClick={() => {
            if (pathname !== '/prototypes' && pathname !== '/') {
              router.push('/prototypes');
            }
          }}
          className="text-lg font-bold p-2 rounded"
        >
          BoardCraft
        </button>
        {userName && pathname !== '/' && (
          <div className="relative" ref={logoutRef}>
            <button
              onClick={() => setShowLogout(!showLogout)}
              className="hover:underline"
            >
              {userName}
            </button>
            {showLogout && (
              <button
                onClick={handleLogout}
                className="absolute right-0 mt-2 bg-white text-black p-2 rounded shadow whitespace-nowrap"
                style={{ minWidth: '80px', top: '100%' }}
              >
                ログアウト
              </button>
            )}
          </div>
        )}
      </header>
      <main style={{ height: 'calc(100vh - 80px)' }}>{children}</main>
      {!shouldHideFooter && (
        <footer
          className="bg-blue-600 text-white p-2 text-center"
          style={{ height: '32px' }}
        >
          &copy; 2024 Code-Son All rights reserved.
        </footer>
      )}
    </div>
  );
};
export default Layout;
