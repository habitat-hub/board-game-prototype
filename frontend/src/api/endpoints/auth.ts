import { UserListData } from '@/__generated__/api/client';
import axiosInstance from '@/api/client';

export const authService = {
  /**
   * ログアウトする
   */
  logout: async () => {
    await axiosInstance.post('/auth/logout');
  },
  /**
   * ユーザーを取得する
   */
  getUser: async (): Promise<UserListData> => {
    const response = await axiosInstance.get('/auth/user');
    return response.data;
  },
};
