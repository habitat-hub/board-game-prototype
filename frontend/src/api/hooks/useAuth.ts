import { useMutation, useQuery } from '@tanstack/react-query';

import { authService } from '@/api/endpoints/auth';

export const useAuth = () => {
  const logout = useMutation({
    mutationFn: authService.logout,
  });

  const getUser = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: authService.getUser,
  });

  return { logout, getUser };
};
