import { Metadata } from 'next';
import React from 'react';

import Login from '@/components/molecules/Login';

// TODO: 将来的にGoogle Auth以外の認証方法を追加して分ける必要が出てきたらサインアップページを実装して、このページをログインページにする
export const metadata: Metadata = {
  title: 'アカウント認証 | KIBAKO',
  description:
    'ボードゲーム試作品作成アプリ「KIBAKO」のアカウント認証のためのページです。',
};

const LoginPage: React.FC = () => {
  return <Login />;
};

export default LoginPage;
