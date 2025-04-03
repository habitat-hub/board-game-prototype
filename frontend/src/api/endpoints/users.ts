import axiosInstance from '@/api/client';
import { UsersSearchListData, UsersSearchListParams } from '@/types';

export const usersService = {
  /**
   * ユーザー名でユーザーを検索する
   */
  searchUsers: async (
    query: UsersSearchListParams
  ): Promise<UsersSearchListData> => {
    const response = await axiosInstance.get('/api/users/search', {
      params: query,
    });
    return response.data;
  },
};
