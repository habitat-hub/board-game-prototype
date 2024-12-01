'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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

  return (
    <div className="h-screen">
      <header
        className="bg-blue-600 text-white p-4 flex justify-between items-center"
        style={{ height: '48px' }}
      >
        <h1 className="text-lg">Code-Son</h1>
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
      <main className="p-4" style={{ height: 'calc(100vh - 80px)' }}>
        {children}
      </main>
      <footer
        className="bg-blue-600 text-white p-2 text-center"
        style={{ height: '32px' }}
      >
        &copy; 2024 Code-Son All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
