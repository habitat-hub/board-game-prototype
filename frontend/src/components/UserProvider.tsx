'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import axiosInstance from '@/utils/axiosInstance';

interface UserProviderProps {
  children: ReactNode;
}

const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser || pathname === '/') {
      setLoading(false);
      return;
    }

    axiosInstance
      .get('/api/users/info')
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
  }, [pathname, router]);

  if (loading) {
    return null; // ローディング中は何も表示しない
  }

  return <>{children}</>;
};

export default UserProvider;
