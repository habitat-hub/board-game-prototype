import { Metadata } from 'next';
import React from 'react';

import Login from '@/components/molecules/Login';

export const metadata: Metadata = {
  title: 'ログイン',
  description: 'ボードゲーム試作品作成アプリ「KIBAKO」のログインページです。',
};

const LoginPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
      <Login />
    </div>
  );
};

export default LoginPage;
