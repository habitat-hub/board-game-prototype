import axiosInstance from '@/api/client';
import { User, UsersSearchListData, UsersSearchListParams } from '@/api/types';

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
   * 複数のユーザーIDからユーザー情報を取得する
   */
  getUsersByIds: async (userIds: string[]): Promise<Record<string, User>> => {
    // ユーザーID配列を使って検索するために、複数のユーザー名検索を並行して実行
    const uniqueUserIds = [...new Set(userIds)]; // 重複を排除
    const userMap: Record<string, User> = {};

    // IDごとに並行してユーザー検索クエリを実行
    await Promise.all(
      uniqueUserIds.map(async (userId) => {
        try {
          // 既存のsearchUsersエンドポイントを使って、ユーザーIDをusernameパラメータとして送信
          // これは一時的な回避策であり、本来は専用のエンドポイントを作るべき
          const users = await usersService.searchUsers({ username: userId });
          // 完全一致のユーザーのみをフィルタリング
          const exactMatch = users.find((user) => user.id === userId);
          if (exactMatch) {
            userMap[userId] = exactMatch;
          }
        } catch (error) {
          console.error(`Error fetching user with ID ${userId}:`, error);
        }
      })
    );

    return userMap;
  },
};
