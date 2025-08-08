import { Metadata } from 'next';
import React from 'react';

import TopPage from '@/features/top/components/templates/TopPage';

export const metadata: Metadata = {
  title: 'KIBAKO',
  description: 'ボードゲーム試作品作成アプリ「KIBAKO」の紹介ページです。',
};

function Home() {
  return <TopPage />;
}

export default Home;
