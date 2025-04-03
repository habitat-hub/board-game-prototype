'use client';

import { useRouter } from 'next/navigation';
import React, { ReactNode, useState, useEffect } from 'react';

import { useAuth } from '@/api/hooks/useAuth';
import { UserListData } from '@/api/types';
import { UserContext } from '@/hooks/useUser';

interface UserProviderProps {
  children: ReactNode;
}

const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const router = useRouter();
  const { getUser } = useAuth();

  // ローディング中か
  const [loading, setLoading] = useState(true);
  // ユーザー情報
  const [user, setUser] = useState<UserListData | null>(null);

  // ユーザー情報チェック、存在しない場合はユーザー情報取得
  useEffect(() => {
    getUser()
      .then((response) => {
        const data = response;
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
  }, [getUser, router]);

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
