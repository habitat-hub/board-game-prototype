import axiosInstance from '@/api/client';
import {
  UsersSearchListData,
  UsersSearchListParams,
  User,
  UsersUpdatePayload,
} from '@/api/types';

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

  /**
   * ユーザー情報を更新する
   */
  updateUser: async (
    userId: string,
    data: UsersUpdatePayload
  ): Promise<User> => {
    const response = await axiosInstance.put(`/api/users/${userId}`, data);
    return response.data;
  },
};
