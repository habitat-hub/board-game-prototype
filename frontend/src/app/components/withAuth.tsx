'use client';

import React, { ComponentType, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/utils/axiosInstance';

export function withAuth<P>(WrappedComponent: ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const [user, setUser] = useState<{ username: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setLoading(false);
      } else {
        axiosInstance
          .get('/auth/user')
          .then((response) => {
            const data = response.data;
            if (data.username) {
              setUser(data);
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
      }
    }, [router]);

    if (loading) {
      return null; // ローディング中は何も表示しない
    }

    return <WrappedComponent {...props} user={user} />;
  };
}
