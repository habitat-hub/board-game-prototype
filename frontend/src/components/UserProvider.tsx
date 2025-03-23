'use client';

import { useRouter } from 'next/navigation';
import React, { ReactNode, useState, useEffect } from 'react';

import axiosInstance from '@/utils/axiosInstance';

interface UserProviderProps {
  children: ReactNode;
}

const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const router = useRouter();
  // ローディング中か
  const [loading, setLoading] = useState(true);

  // ユーザー情報チェック、存在しない場合はユーザー情報取得
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    // ローカルストレージにユーザーが存在する場合
    if (storedUser) {
      setLoading(false);
      return;
    }

    axiosInstance
      .get('/auth/user')
      .then((response) => {
        const data = response.data;
        // ユーザーが存在しない、またはidが存在しない場合
        if (!data || !data.id) {
          setLoading(false);
          router.replace('/');
          return;
        }

        localStorage.setItem('user', JSON.stringify(data));
        window.dispatchEvent(new Event('userUpdated'));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        router.replace('/');
      });
  }, [router]);

  // ローディング中の場合
  if (loading) {
    return null;
  }

  return <>{children}</>;
};

export default UserProvider;
