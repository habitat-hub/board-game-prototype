'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

import { isMaintenanceMode } from '@/utils/maintenance';

// メンテナンス再読み込みボタンコンポーネントのProps型定義
interface MaintenanceReloadButtonProps {
  // メンテナンス終了後にリダイレクトする元のページURL
  returnTo: string;
}

/**
 * メンテナンスページの再読み込みボタンコンポーネント
 * メンテナンス状態に応じてページ再読み込みまたは元のページへのリダイレクトを行う
 */
const MaintenanceReloadButton: React.FC<MaintenanceReloadButtonProps> = ({
  returnTo,
}): React.JSX.Element => {
  const router = useRouter();

  // コンポーネントマウント時にメンテナンス状態をチェック
  // 画面上のリロードボタン、もしくは、ブラウザのリロードで発火
  useEffect(() => {
    // メンテナンスモードが解除されており、リダイレクト先が指定されている場合
    if (!isMaintenanceMode() && returnTo) {
      router.replace(returnTo);
    }
  }, [router, returnTo]);

  /*
   * ページ再読み込みまたはリダイレクト処理
   * メンテナンスモードの場合はページを再読み込み
   * それ以外の場合は指定された元のページへリダイレクト
   */
  const handleReload = () => {
    try {
      window.location.reload();
    } catch (error) {
      console.error('Error reloading the page:', error);
    }
  };

  return (
    <div className="mt-6 pt-4 border-t border-wood-light">
      <button
        onClick={handleReload}
        className="text-kibako-accent hover:text-kibako-primary text-sm transition-colors duration-200 font-medium"
      >
        ページを再読み込み
      </button>
    </div>
  );
};

export default MaintenanceReloadButton;
