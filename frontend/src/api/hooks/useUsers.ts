import { useCallback } from 'react';

import { usersService } from '@/api/endpoints/users';
import { UsersSearchListParams } from '@/api/types';

export const useUsers = () => {
  /**
   * ユーザーを検索する
   */
  const searchUsers = useCallback(async (query: UsersSearchListParams) => {
    return await usersService.searchUsers(query);
  }, []);

  /**
   * 複数のユーザーIDからユーザー情報を取得する
   */
  const getUsersByIds = useCallback(async (userIds: string[]) => {
    return await usersService.getUsersByIds(userIds);
  }, []);

  return {
    searchUsers,
    getUsersByIds,
  };
};
