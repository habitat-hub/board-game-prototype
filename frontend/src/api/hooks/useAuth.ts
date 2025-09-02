import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { authService } from '@/api/endpoints/auth';

export const useAuth = () => {
  const queryClient = useQueryClient();

  /**
   * ログアウトする
   */
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => queryClient.removeQueries({ queryKey: ['auth', 'user'] }),
  });
  const logout = useCallback(
    () => logoutMutation.mutateAsync(),
    [logoutMutation]
  );

  /**
   * ユーザーを取得する
   */
  const getUser = useCallback(
    () =>
      queryClient.fetchQuery({
        queryKey: ['auth', 'user'],
        queryFn: () => authService.getUser(),
      }),
    [queryClient]
  );

  return { logout, getUser };
};
