'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { GiWoodenCrate } from 'react-icons/gi';

import {
  isMaintenanceMode,
  getMaintenanceMessage,
  getMaintenanceEndTime,
} from '@/utils/maintenance';

/**
 * メンテナンスページコンポーネント
 * メンテナンス中のシステム状態をユーザーに通知するためのページ
 * このコンポーネントは、メンテナンス中の情報を表示し、ユーザーに再読み込みを促す
 * また、メンテナンスモードが解除された場合は元のページに戻る機能も提供する
 * @returns メンテナンスページのJSX要素
 */
const Maintenance: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // クエリパラメータから元のパスを取得
  // メンテナンスページにリダイレクトされた場合、returnToパラメータに元のパスが含まれる
  // 例: /maintenance?returnTo=/original-path
  // これを使ってメンテナンスモードが解除された際に元のパスに戻る
  const returnTo = searchParams.get('returnTo');

  // メンテナンスメッセージを取得
  const message = getMaintenanceMessage();
  // メンテナンス終了予定時刻を取得
  const endTime = getMaintenanceEndTime();

  const handleReload = () => {
    // メンテナンスモードが解除されていて元のパスがある場合はそこに戻る
    if (!isMaintenanceMode()) {
      router.replace(returnTo || '/');
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-content-secondary to-content-DEFAULT flex items-center justify-center p-4">
      {/* メンテナンス情報カード */}
      <div className="max-w-md w-full bg-kibako-white rounded-lg shadow-xl p-8 text-center border border-wood-light">
        {/* ヘッダー部分：ロゴとタイトル */}
        <div className="mb-6">
          {/* KIBAKOロゴ（木箱アイコン）とタイトル */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <GiWoodenCrate className="text-5xl sm:text-7xl drop-shadow-lg text-kibako-accent" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-wider text-kibako-primary">
              KIBAKO
            </h2>
          </div>

          {/* メインタイトルと説明 */}
          <h1 className="text-2xl font-bold text-kibako-primary mb-2">
            メンテナンス中
          </h1>
          <p className="text-kibako-secondary">
            現在、システムメンテナンスを実施しております。
          </p>
        </div>

        {/* メンテナンス詳細情報 */}
        <div className="bg-kibako-tertiary rounded-lg p-4 mb-6 border border-wood-light">
          <p className="text-sm text-kibako-primary mb-2">{message}</p>
          {/* 終了予定時刻が設定されている場合 */}
          {endTime && (
            <p className="text-sm text-kibako-secondary">終了予定: {endTime}</p>
          )}
        </div>

        {/* ステータスインジケーター */}
        <div className="flex items-center justify-center space-x-2 text-sm text-kibako-secondary">
          <div className="w-2 h-2 bg-kibako-accent rounded-full animate-pulse"></div>
          <span>システム復旧作業中...</span>
        </div>

        {/* 再読み込みボタン */}
        <div className="mt-6 pt-4 border-t border-wood-light">
          <button
            onClick={handleReload}
            className="text-kibako-accent hover:text-kibako-primary text-sm transition-colors duration-200 font-medium"
          >
            ページを再読み込み
          </button>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
