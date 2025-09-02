'use client';

import { useRouter } from 'next/navigation';
import React, { ReactNode, useState, useEffect, createContext } from 'react';

import { useAuth } from '@/api/hooks/useAuth';
import { UserListData } from '@/api/types';

// ユーザー情報コンテキスト型
interface UserContextType {
  // ユーザー情報
  user: UserListData | null;
  // ユーザー情報を設定
  setUser: (user: UserListData | null) => void;
  // ローディング状態
  isLoading: boolean;
}

// ユーザー情報コンテキスト
export const UserContext = createContext<UserContextType | undefined>(
  undefined
);

// ユーザー情報プロバイダー
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const { getUser } = useAuth();

  // ユーザー情報
  const [user, setUser] = useState<UserListData | null>(null);

  useEffect(() => {
    if (getUser.isSuccess) {
      const data = getUser.data;
      if (!data || !data.id) {
        router.replace('/');
        return;
      }
      setUser(data);
    }
    if (getUser.isError) {
      router.replace('/');
    }
  }, [getUser.data, getUser.isError, getUser.isSuccess, router]);

  return (
    <UserContext.Provider
      value={{ user, setUser, isLoading: getUser.isLoading }}
    >
      {children}
    </UserContext.Provider>
  );
};
