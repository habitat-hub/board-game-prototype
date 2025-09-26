'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

import { WoodenCrateBackground } from '@/components/atoms/WoodenCrateBackground';
import Header from '@/components/organisms/Header';
import Loading from '@/components/organisms/Loading';
import { useClientPathInfo } from '@/hooks/useClientPathInfo';
import { useIsPC } from '@/hooks/useIsPC';

// 非PCで閲覧可能な静的パス一覧
const MOBILE_ACCESSIBLE_PATHS: ReadonlySet<string> = new Set<string>([
  '/',
  '/business-information',
  '/privacy-policy',
  '/terms-of-service',
]);

const normalizePathname = (pathname: string) => {
  if (pathname === '/') return pathname;
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
};

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

/**
 * クライアント専用レイアウト。非PCデバイスはトップへリダイレクトする。
 */
export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { pathname, isGameBoardPath } = useClientPathInfo();
  const normalizedPathname = normalizePathname(pathname);
  const isMobileAccessiblePath =
    MOBILE_ACCESSIBLE_PATHS.has(normalizedPathname);
  const { isPC, isReady } = useIsPC();

  // 非PCデバイスはトップページへ戻す
  useEffect(() => {
    if (!isReady) return;
    if (!isPC && !isMobileAccessiblePath) {
      router.replace('/');
    }
  }, [isMobileAccessiblePath, isPC, isReady, router]);

  // デバイスチェック中は読み込み表示を返すことで、
  // サーバーサイドレンダリングとの整合性を保つ
  if (!isReady && !isMobileAccessiblePath) {
    return <Loading />;
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
