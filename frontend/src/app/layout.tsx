'use client';

import { usePathname } from 'next/navigation';
import React from 'react';

import './globals.css';
import Header from '@/components/Header';
import { UserProvider } from '@/contexts/UserContext';
import { WoodenCrateBackground } from '@/features/prototype/components/atoms/WoodenCrateBackground';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // 背景画像を表示するか
  const isCanvas = /^\/prototypes\/[a-f0-9-]+\/versions\/[a-f0-9-]+\//.test(
    pathname
  );

  // ヘッダーの高さ定数
  const HEADER_HEIGHT_PX = 60;

  return (
    <html lang="ja">
      <body>
        <UserProvider>
          <>
            {!isCanvas && <WoodenCrateBackground />}
            {!isCanvas && <Header height={HEADER_HEIGHT_PX} />}
            {children}
          </>
        </UserProvider>
      </body>
    </html>
  );
}
