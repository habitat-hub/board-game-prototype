import { createContext, useContext } from 'react';

import { UserListData } from '@/types';

interface UserContextType {
  // ユーザー情報
  user: UserListData | null;
  // ユーザー情報を設定
  setUser: (user: UserListData | null) => void;
}

export const UserContext = createContext<UserContextType | undefined>(
  undefined
);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
