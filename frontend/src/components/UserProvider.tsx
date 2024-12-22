'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import axiosInstance from '@/utils/axiosInstance';

interface UserProviderProps {
  children: ReactNode;
}

const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setLoading(false);
      return;
    }

    axiosInstance
      .get('/user')
      .then((response) => {
        const data = response.data;
        if (data.username) {
          localStorage.setItem('user', JSON.stringify(data));
          window.dispatchEvent(new Event('userUpdated'));
        } else {
          router.replace('/');
        }
      })
      .catch(() => {
        router.replace('/');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return null; // ローディング中は何も表示しない
  }

  return <>{children}</>;
};

export default UserProvider;
