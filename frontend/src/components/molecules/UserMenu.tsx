'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/api/hooks/useAuth';
import UserAvatar from '@/features/role/components/atoms/UserAvatar';
import { useUser } from '@/hooks/useUser';

// フィードバックフォームのURL
const FEEDBACK_FORM_URL = 'https://forms.gle/XjMV2WgFRCJg7cHj7';

interface UserMenuProps {
  pathname: string;
}

const UserMenu: React.FC<UserMenuProps> = ({ pathname }) => {
  const router = useRouter();
  const { user, setUser, isLoading } = useUser();
  const { logout } = useAuth();

  // メニューの表示状態
  const [showMenu, setShowMenu] = useState(false);
  // メニューのRef
  const menuRef = useRef<HTMLDivElement>(null);

  /**
   * メニューの外側をクリックしたらメニューを非表示にする
   */
  const handleClickMenuOutside = (event: MouseEvent): void => {
    // Refが存在しない、またはRefが存在してもクリックされた要素がRefの要素の場合（この場合ログアウト処理が走る）
    if (!menuRef.current || menuRef.current.contains(event.target as Node))
      return;

    setShowMenu(false);
  };

  // ログアウトメニュー表示時のクリックイベントハンドラー登録
  useEffect(() => {
    document.addEventListener('mousedown', handleClickMenuOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickMenuOutside);
    };
  }, []);

  // パスが変わったらメニューを非表示にする
  useEffect(() => {
    setShowMenu(false);
  }, [pathname]);

  /**
   * ログアウトする
   */
  const handleLogout = () => {
    logout()
      .then(() => {
        setUser(null);
        router.replace('/');
      })
      .catch((error) => console.error('Logout error:', error));
  };

  // ローディング時はnullを返す
  if (isLoading) {
    return null;
  }

  // ユーザーがログインしていない場合
  if (!user?.username) {
    // /loginページの場合は何も表示しない
    if (pathname === '/login') {
      return null;
    }

    // /login以外のページではログインボタンを表示
    return (
      <Link
        href="/login"
        className="px-4 py-2 bg-kibako-primary text-kibako-white rounded-lg hover:bg-kibako-primary/90 hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
      >
        ログイン
      </Link>
    );
  }

  return (
    <div className="relative z-overlay" ref={menuRef}>
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        aria-haspopup="menu"
        aria-expanded={showMenu}
        aria-controls="user-menu-dropdown"
        aria-label={`${user.username}のユーザーメニュー`}
        className="rounded-full transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kibako-accent focus-visible:ring-offset-2 focus-visible:ring-offset-kibako-tertiary"
      >
        <UserAvatar username={user.username} size="md" />
      </button>

      {showMenu && (
        <div
          id="user-menu-dropdown"
          role="menu"
          className="absolute right-0 top-full z-dropdown w-40 flex flex-col mt-2 overflow-hidden rounded-lg border border-kibako-secondary/30 bg-kibako-tertiary/95 text-sm shadow-md backdrop-blur-sm"
        >
          {/* ユーザー名表示行 */}
          <div className="flex items-center gap-2 p-2 bg-kibako-secondary/10 border-b border-kibako-secondary/20">
            <UserAvatar username={user.username} size="sm" variant="subtle" />
            <span className="font-medium leading-5 text-kibako-primary">
              {user.username}
            </span>
          </div>

          <Link
            href="/projects"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-kibako-primary transition-colors duration-200 hover:bg-kibako-secondary/10"
          >
            プロジェクト一覧
          </Link>
          <Link
            href="/profile/edit"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-kibako-primary transition-colors duration-200 hover:bg-kibako-secondary/10"
          >
            プロフィール編集
          </Link>
          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-kibako-primary transition-colors duration-200 hover:bg-kibako-secondary/10"
          >
            フィードバック
          </a>
          <Link
            href="/donate"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-kibako-primary transition-colors duration-200 hover:bg-kibako-secondary/10"
          >
            KIBAKOに寄付
          </Link>
          <button
            onClick={handleLogout}
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-kibako-primary transition-colors duration-200 hover:bg-kibako-secondary/10"
          >
            ログアウト
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
