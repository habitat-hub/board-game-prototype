import { Metadata } from 'next';
import React from 'react';

import LandingPage from '@/features/landing/components/LandingPage';

export const metadata: Metadata = {
  title: 'KIBAKOについて',
  description: 'ボードゲーム試作品作成アプリ「KIBAKO」の紹介ページです。',
};

const AboutPage: React.FC = () => {
  return <LandingPage />;
};

export default AboutPage;
