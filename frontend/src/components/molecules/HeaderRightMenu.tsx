'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/api/hooks/useAuth';
import { useUser } from '@/hooks/useUser';

// フィードバックフォームのURL
const FEEDBACK_FORM_URL = 'https://forms.gle/XjMV2WgFRCJg7cHj7';

interface HeaderRightMenuProps {
  pathname: string;
}

const HeaderRightMenu: React.FC<HeaderRightMenuProps> = ({ pathname }) => {
  const router = useRouter();
  const { user } = useUser();
  const { logout } = useAuth();

  // ログアウトメニューの表示状態
  const [showLogout, setShowLogout] = useState(false);
  // ログアウトメニューのRef
  const logoutRef = useRef<HTMLDivElement>(null);

  /**
   * ログアウトボタンの外側をクリックしたらログアウトボタンを非表示にする
   */
  const handleClickLogoutOutside = (event: MouseEvent): void => {
    // Refが存在しない、またはRefが存在してもクリックされた要素がRefの要素の場合（この場合ログアウト処理が走る）
    if (!logoutRef.current || logoutRef.current.contains(event.target as Node))
      return;

    setShowLogout(false);
  };

  // ログアウトメニュー表示時のクリックイベントハンドラー登録
  useEffect(() => {
    document.addEventListener('mousedown', handleClickLogoutOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickLogoutOutside);
    };
  }, []);

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

  // ユーザーがログインしていない場合または現在のパスがトップページの場合は何も表示しない
  if (!user?.username || pathname === '/') {
    return null;
  }

  return (
    <div className="relative z-50" ref={logoutRef}>
      <button
        onClick={() => setShowLogout(!showLogout)}
        className="hover:text-amber-200 transition-colors duration-200 px-4 py-1.5 border border-amber-400/30 rounded-full flex items-center gap-2 bg-amber-700/40"
      >
        <span className="text-amber-100">{user.username}</span>
      </button>

      {showLogout && (
        <div className="absolute right-0 top-full w-48 flex flex-col mt-2 shadow-xl rounded-lg overflow-hidden bg-amber-50 border border-amber-200 z-50">
          <Link
            href="/groups"
            className="block w-full text-amber-900 p-2.5 text-left hover:bg-amber-100 transition-colors duration-200"
          >
            プロトタイプ一覧
          </Link>
          <Link
            href="/profile/edit"
            className="block w-full text-amber-900 p-2.5 text-left hover:bg-amber-100 transition-colors duration-200"
          >
            プロフィール編集
          </Link>
          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-amber-900 p-2.5 text-left hover:bg-amber-100 transition-colors duration-200"
          >
            フィードバック
          </a>
          <button
            onClick={handleLogout}
            className="block w-full text-amber-900 p-2.5 text-left hover:bg-amber-100 transition-colors duration-200"
          >
            ログアウト
          </button>
        </div>
      )}
    </div>
  );
};

export default HeaderRightMenu;
