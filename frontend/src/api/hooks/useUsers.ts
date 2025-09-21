import { useCallback } from 'react';

import { usersService } from '@/api/endpoints/users';
import {
  UsersSearchListParams,
  UsersUpdatePayload,
  UsersNeedTutorialListData,
} from '@/api/types';

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

  /**
   * チュートリアル表示が必要かどうかを確認する
   */
  const checkNeedTutorial = useCallback(
    async (userId: string): Promise<UsersNeedTutorialListData> => {
      return await usersService.checkNeedTutorial(userId);
    },
    []
  );

  return {
    searchUsers,
    updateUser,
    checkNeedTutorial,
  };
};
