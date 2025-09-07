'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

import { WoodenCrateBackground } from '@/components/atoms/WoodenCrateBackground';
import Header from '@/components/organisms/Header';
import { useClientPathInfo } from '@/hooks/useClientPathInfo';
import { useIsPC } from '@/hooks/useIsPC';

// QueryClientの設定
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // タブが切り替わった時に自動的にリフェッチする
      refetchOnWindowFocus: true,
      // 5分間キャッシュを保持
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { pathname, isGameBoardPath } = useClientPathInfo();
  const { isPC, isReady } = useIsPC();

  // 非PCデバイスはトップページへ戻す
  useEffect(() => {
    if (!isReady) return;
    if (!isPC && pathname !== '/') {
      router.push('/');
    }
  }, [isPC, isReady, pathname, router]);

  // デバイスチェック中は読み込み表示を返すことで、
  // サーバーサイドレンダリングとの整合性を保つ
  if (!isReady && pathname !== '/') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="bg-kibako-tertiary min-h-screen">
        {!isGameBoardPath && <WoodenCrateBackground />}
        {!isGameBoardPath && <Header />}
        <main>{children}</main>
      </div>
    </QueryClientProvider>
  );
}
