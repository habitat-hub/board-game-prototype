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

  return {
    searchUsers,
  };
};
