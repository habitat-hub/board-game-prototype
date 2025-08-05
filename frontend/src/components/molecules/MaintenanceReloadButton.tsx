'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

import { isMaintenanceMode } from '@/utils/maintenance';

interface MaintenanceReloadButtonProps {
  returnTo?: string;
}

/**
 * メンテナンスページの再読み込みボタンコンポーネント
 * メンテナンス状態に応じてページ再読み込みまたは元のページへのリダイレクトを行う
 */
const MaintenanceReloadButton: React.FC<MaintenanceReloadButtonProps> = ({
  returnTo,
}) => {
  const router = useRouter();

  // コンポーネントマウント時にメンテナンス状態をチェック
  useEffect(() => {
    if (!isMaintenanceMode() && returnTo) {
      router.replace(returnTo);
    }
  }, [router, returnTo]);

  const handleReload = () => {
    // メンテナンスモードが解除されていて元のパスがある場合はそこに戻る
    if (!isMaintenanceMode()) {
      router.replace(returnTo || '/');
    } else {
      window.location.reload();
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
