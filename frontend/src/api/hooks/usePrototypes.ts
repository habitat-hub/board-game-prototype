import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { prototypesService } from '@/api/endpoints/prototypes';
import { PrototypesUpdatePayload } from '@/api/types';

export const usePrototypes = () => {
  const queryClient = useQueryClient();

  /**
   * プロトタイプ更新（useMutation版）
   */
  const useUpdatePrototype = () => {
    return useMutation({
      mutationFn: ({ prototypeId, data }: { prototypeId: string; data: PrototypesUpdatePayload }) =>
        prototypesService.updatePrototype(prototypeId, data),
      onSuccess: () => {
        // 成功時にプロジェクト一覧のキャッシュを無効化して再取得
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      },
    });
  };

  /**
   * プロトタイプ詳細取得
   */
  const getPrototype = useCallback(async (prototypeId: string) => {
    return await prototypesService.getPrototype(prototypeId);
  }, []);



  /**
   * プロトタイプ削除
   */
  const deletePrototype = useCallback(async (prototypeId: string) => {
    return await prototypesService.deletePrototype(prototypeId);
  }, []);

  return {
    useUpdatePrototype,
    getPrototype,
    deletePrototype,
  };
};
