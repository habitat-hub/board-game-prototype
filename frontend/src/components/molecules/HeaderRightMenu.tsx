'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/api/hooks/useAuth';
import { useUser } from '@/hooks/useUser';

import Button from '../atoms/Button';

// フィードバックフォームのURL
const FEEDBACK_FORM_URL = 'https://forms.gle/XjMV2WgFRCJg7cHj7';

interface HeaderRightMenuProps {
  pathname: string;
}

const HeaderRightMenu: React.FC<HeaderRightMenuProps> = ({ pathname }) => {
  const router = useRouter();
  const { user, setUser } = useUser();
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

  // ユーザーがログインしていない場合は何も表示しない
  if (!user?.username) {
    return null;
  }

  return (
    <div className="relative z-50" ref={menuRef}>
      <Button
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        className="border-kibako-white/30 border"
      >
        <span>{user.username}</span>
      </Button>

      {showMenu && (
        <div className="absolute right-0 top-full w-48 flex flex-col mt-2 shadow-xl rounded-lg overflow-hidden bg-kibako-tertiary border border-kibako-secondary/30">
          <Link
            href="/projects"
            className="block w-full text-kibako-primary p-2 text-left hover:bg-kibako-secondary/10 transition-colors duration-200"
          >
            プロトタイプ一覧
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
