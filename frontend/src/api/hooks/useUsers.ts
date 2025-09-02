import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { usersService } from '@/api/endpoints/users';
import {
  UsersSearchListParams,
  UsersUpdatePayload,
  UsersNeedTutorialData,
} from '@/api/types';

export const useUsers = () => {
  const queryClient = useQueryClient();

  /**
   * ユーザーを検索する
   */
  const searchUsersMutation = useMutation({
    mutationFn: (query: UsersSearchListParams) => usersService.searchUsers(query),
  });
  const searchUsers = useCallback(
    (query: UsersSearchListParams) => searchUsersMutation.mutateAsync(query),
    [searchUsersMutation]
  );

  /**
   * ユーザー情報を更新する
   */
  const updateUserMutation = useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: UsersUpdatePayload;
    }) => usersService.updateUser(userId, data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({
        queryKey: ['users', updatedUser.id],
      });
    },
  });
  const updateUser = useCallback(
    (userId: string, data: UsersUpdatePayload) =>
      updateUserMutation.mutateAsync({ userId, data }),
    [updateUserMutation]
  );

  /**
   * チュートリアル表示が必要かどうかを確認する
   */
  const checkNeedTutorial = useCallback(
    (userId: string) =>
      queryClient.fetchQuery<UsersNeedTutorialData>({
        queryKey: ['users', userId, 'needTutorial'],
        queryFn: () => usersService.checkNeedTutorial(userId),
      }),
    [queryClient]
  );

  return {
    searchUsers,
    updateUser,
    checkNeedTutorial,
  };
};
