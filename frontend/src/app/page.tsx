import React from 'react';
import { Metadata } from 'next';
import Login from '@/features/prototype/components/organisms/Login';

export const metadata: Metadata = {
  title: 'ログイン',
};

function Home() {
  return <Login />;
}

export default Home;
