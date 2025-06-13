'use client';

import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import * as UAParser from 'ua-parser-js';

import Header from '@/components/organisms/Header';
import { WoodenCrateBackground } from '@/features/prototype/components/atoms/WoodenCrateBackground';

export const HEADER_HEIGHT_PX = 80;

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  // 初期値をfalseにすることでSSRとクライアント側のレンダリングを一致させる
  const [isCheckingDevice, setIsCheckingDevice] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Canvas上で表示する場合はヘッダーを非表示にする
  const isCanvas = /^\/prototypes\/groups\/[a-f0-9-]+\/[a-f0-9-]+\//.test(
    pathname
  );

  useEffect(() => {
    // クライアントサイドでのみデバイスチェックを実行
    if (
      typeof window !== 'undefined' &&
      !pathname.includes('/unsupported-device')
    ) {
      setIsCheckingDevice(true);

      const parser = new UAParser.UAParser();
      const result = parser.getResult();
      const deviceType = result.device.type;

      // モバイルまたはタブレットの場合にリダイレクトフラグを設定
      if (
        (deviceType === 'mobile' || deviceType === 'tablet') &&
        pathname !== '/unsupported-device'
      ) {
        setShouldRedirect(true);
      }

      setIsCheckingDevice(false);
    }
  }, [pathname]);

  // リダイレクトが必要な場合は実行
  useEffect(() => {
    if (shouldRedirect && pathname !== '/unsupported-device') {
      router.push('/unsupported-device');
    }
  }, [shouldRedirect, router, pathname]);

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
    <>
      {!isCanvas && <WoodenCrateBackground />}
      {!isCanvas && <Header height={HEADER_HEIGHT_PX} />}
      <div style={{ paddingTop: isCanvas ? 0 : HEADER_HEIGHT_PX }}>
        {children}
      </div>
    </>
  );
}
