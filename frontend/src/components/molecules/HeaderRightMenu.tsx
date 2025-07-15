'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/api/hooks/useAuth';
import UserAvatar from '@/features/role/components/atoms/UserAvatar';
import { useUser } from '@/hooks/useUser';

// フィードバックフォームのURL
const FEEDBACK_FORM_URL = 'https://forms.gle/XjMV2WgFRCJg7cHj7';

interface HeaderRightMenuProps {
  pathname: string;
}

const HeaderRightMenu: React.FC<HeaderRightMenuProps> = ({ pathname }) => {
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
        className="px-4 py-2 bg-kibako-primary text-white rounded-lg hover:bg-kibako-primary/90 hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
      >
        ログイン
      </Link>
    );
  }

  return (
    <div className="relative z-50" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="rounded-full p-2 bg-white/5 border border-kibako-secondary/20 hover:bg-kibako-secondary/15 hover:border-kibako-secondary/40 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
      >
        <UserAvatar username={user.username} size="md" />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full w-48 flex flex-col mt-2 shadow-xl rounded-lg overflow-hidden bg-kibako-tertiary border border-kibako-secondary/30">
          {/* ユーザー名表示行 */}
          <div className="flex items-center gap-3 p-3 bg-kibako-secondary/5 border-b border-kibako-secondary/20">
            <UserAvatar username={user.username} size="sm" />
            <span className="font-medium text-kibako-primary">
              {user.username}
            </span>
          </div>

          <Link
            href="/projects"
            className="block w-full text-kibako-primary p-2 text-left hover:bg-kibako-secondary/10 transition-colors duration-200"
          >
            プロジェクト一覧
          </Link>
          <Link
            href="/profile/edit"
            className="block w-full text-kibako-primary p-2 text-left hover:bg-kibako-secondary/10 transition-colors duration-200"
          >
            プロフィール編集
          </Link>
          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-kibako-primary p-2 text-left hover:bg-kibako-secondary/10 transition-colors duration-200"
          >
            フィードバック
          </a>
          <button
            onClick={handleLogout}
            className="block w-full text-kibako-primary p-2 text-left hover:bg-kibako-secondary/10 transition-colors duration-200"
          >
            ログアウト
          </button>
        </div>
      )}
    </div>
  );
};

export default HeaderRightMenu;
