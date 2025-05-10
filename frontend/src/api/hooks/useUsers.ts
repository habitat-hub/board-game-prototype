import { useCallback } from 'react';

import { usersService } from '@/api/endpoints/users';
import { UsersSearchListParams, UsersUpdatePayload } from '@/api/types';

export const useUsers = () => {
  /**
   * ユーザーを検索する
   */
  const searchUsers = useCallback(async (query: UsersSearchListParams) => {
    return await usersService.searchUsers(query);
  }, []);

  /**
   * ユーザー情報を更新する
   */
  const updateUser = useCallback(
    async (userId: string, data: UsersUpdatePayload) => {
      return await usersService.updateUser(userId, data);
    },
    []
  );

  return {
    searchUsers,
    updateUser,
  };
};
