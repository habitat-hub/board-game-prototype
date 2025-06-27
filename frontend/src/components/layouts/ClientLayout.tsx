'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import * as UAParser from 'ua-parser-js';

import Header from '@/components/organisms/Header';
import { WoodenCrateBackground } from '@/features/prototype/components/atoms/WoodenCrateBackground';
import { useClientPathInfo } from '@/hooks/useClientPathInfo';

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { isGameBoardPath, isUnsupportedDevicePath } = useClientPathInfo();
  // 初期値をfalseにすることでSSRとクライアント側のレンダリングを一致させる
  const [isCheckingDevice, setIsCheckingDevice] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // クライアントサイドでのみデバイスチェックを実行
    if (typeof window !== 'undefined' && !isUnsupportedDevicePath) {
      setIsCheckingDevice(true);

      const parser = new UAParser.UAParser();
      const result = parser.getResult();
      const deviceType = result.device.type;

      // モバイルまたはタブレットの場合にリダイレクトフラグを設定
      if (
        (deviceType === 'mobile' || deviceType === 'tablet') &&
        !isUnsupportedDevicePath
      ) {
        setShouldRedirect(true);
      }

      setIsCheckingDevice(false);
    }
  }, [isUnsupportedDevicePath]);

  // リダイレクトが必要な場合は実行
  useEffect(() => {
    if (shouldRedirect && !isUnsupportedDevicePath) {
      router.push('/unsupported-device');
    }
  }, [shouldRedirect, isUnsupportedDevicePath, router]);

  // デバイスチェック中は読み込み表示を返すことで、
  // サーバーサイドレンダリングとの整合性を保つ
  if (isCheckingDevice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-kibako-tertiary min-h-screen">
      {!isGameBoardPath && <WoodenCrateBackground />}
      {!isGameBoardPath && <Header />}
      <main>{children}</main>
    </div>
  );
}
