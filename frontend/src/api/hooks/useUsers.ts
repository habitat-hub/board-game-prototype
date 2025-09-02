import { useMutation } from '@tanstack/react-query';

import { usersService } from '@/api/endpoints/users';
import {
  UsersSearchListParams,
  UsersUpdatePayload,
  UsersNeedTutorialData,
} from '@/api/types';

export const useUsers = () => {
  const searchUsers = useMutation({
    mutationFn: (query: UsersSearchListParams) =>
      usersService.searchUsers(query),
  });

  const updateUser = useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: UsersUpdatePayload;
    }) => usersService.updateUser(userId, data),
  });

  const checkNeedTutorial = useMutation({
    mutationFn: (userId: string): Promise<UsersNeedTutorialData> =>
      usersService.checkNeedTutorial(userId),
  });

  return {
    searchUsers,
    updateUser,
    checkNeedTutorial,
  };
};
