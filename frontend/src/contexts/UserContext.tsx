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
  // ローディング状態
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
        setIsLoading(false);
      });
  }, [getUser, router]);

  return (
    <UserContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};
