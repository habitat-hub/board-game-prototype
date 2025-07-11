import { Metadata } from 'next';
import React from 'react';

import About from '@/features/about/components/templates/About';

export const metadata: Metadata = {
  title: 'KIBAKOについて',
  description: 'ボードゲーム試作品作成アプリ「KIBAKO」の紹介ページです。',
};

const AboutPage: React.FC = () => {
  return <About />;
};

export default AboutPage;
