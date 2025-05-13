'use client';
import { usePathname } from 'next/navigation';
import React from 'react';

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { WoodenCrateBackground } from '@/features/prototype/components/atoms/WoodenCrateBackground';

// フッターを非表示にしたいURLパターン
const hideFooterPattern = /^\/prototypes\/[a-f0-9-]+\/versions\/[a-f0-9-]+\//;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const pathname = usePathname();

  // フッターと背景画像を表示するか
  const showsFooterAndBackgroundImage = !hideFooterPattern.test(pathname);

  return (
    <div className="h-screen">
      <Header />
      <main
        className="bg-content px-6 md:px-12 lg:px-24 overflow-auto"
        style={{
          height: `calc(100vh - ${showsFooterAndBackgroundImage ? '92px' : '60px'})`,
        }}
      >
        {showsFooterAndBackgroundImage && <WoodenCrateBackground />}
        {children}
      </main>
      {showsFooterAndBackgroundImage && <Footer />}
    </div>
  );
};
export default Layout;
