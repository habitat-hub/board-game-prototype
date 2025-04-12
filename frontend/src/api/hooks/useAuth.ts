import { useCallback } from 'react';

import { authService } from '@/api/endpoints/auth';

export const useAuth = () => {
  /**
   * ログアウトする
   */
  const logout = useCallback(async () => {
    await authService.logout();
  }, []);

  /**
   * ユーザーを取得する
   */
  const getUser = useCallback(async () => {
    const user = await authService.getUser();
    return user;
  }, []);

  return { logout, getUser };
};
