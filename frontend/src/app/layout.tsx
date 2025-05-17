'use client';

import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import * as UAParser from 'ua-parser-js';

import './globals.css';
import Header from '@/components/organisms/Header';
import { UserProvider } from '@/contexts/UserContext';
import { WoodenCrateBackground } from '@/features/prototype/components/atoms/WoodenCrateBackground';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // 背景画像を表示するか
  const isCanvas = /^\/prototypes\/[a-f0-9-]+\/versions\/[a-f0-9-]+\//.test(
    pathname
  );

  // ヘッダーの高さ定数
  const HEADER_HEIGHT_PX = 80;

  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      const parser = new UAParser.UAParser();
      const result = parser.getResult();
      const deviceType = result.device.type;

      // モバイルまたはタブレットの場合にリダイレクト
      if (deviceType === 'mobile' || deviceType === 'tablet') {
        // すでに非対応デバイスページにいる場合はリダイレクトしない
        if (pathname !== '/unsupported-device') {
          router.push('/unsupported-device');
        }
      }

      setIsLoading(false);
    }
  }, [pathname, router]);

  // ローディング中は何も表示しない（フラッシュを防ぐため）
  if (isLoading && typeof window !== 'undefined') {
    return null;
  }

  return (
    <html lang="ja">
      <body>
        <UserProvider>
          <>
            {!isCanvas && <WoodenCrateBackground />}
            {!isCanvas && <Header height={HEADER_HEIGHT_PX} />}
            <main style={{ paddingTop: isCanvas ? 0 : HEADER_HEIGHT_PX }}>
              {children}
            </main>
          </>
        </UserProvider>
      </body>
    </html>
  );
}
