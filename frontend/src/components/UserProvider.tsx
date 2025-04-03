'use client';

import { AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';
import React, { ReactNode, useState, useEffect } from 'react';

import { UserContext } from '@/hooks/useUser';
import { UserListData } from '@/types';
import axiosInstance from '@/utils/axiosInstance';

interface UserProviderProps {
  children: ReactNode;
}

const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const router = useRouter();
  // ローディング中か
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserListData | null>(null);

  // ユーザー情報チェック、存在しない場合はユーザー情報取得
  useEffect(() => {
    axiosInstance
      .get('/auth/user')
      .then((response: AxiosResponse<UserListData>) => {
        const data = response.data;
        // ユーザーが存在しない、またはidが存在しない場合
        if (!data || !data.id) {
          throw new Error('ユーザーが存在しません');
        }

        setUser(data);
      })
      .catch(() => {
        router.replace('/');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  // ローディング中の場合
  if (loading) {
    return null;
  }

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
