import { useCallback } from 'react';

import { prototypesService } from '@/api/endpoints/prototypes';
import { PrototypesUpdatePayload } from '@/api/types';

export const usePrototypes = () => {
  /**
   * プロトタイプ詳細取得
   */
  const getPrototype = useCallback(async (prototypeId: string) => {
    return await prototypesService.getPrototype(prototypeId);
  }, []);

  /**
   * プロトタイプ更新
   */
  const updatePrototype = useCallback(
    async (prototypeId: string, data: PrototypesUpdatePayload) => {
      return await prototypesService.updatePrototype(prototypeId, data);
    },
    []
  );

  /**
   * プロトタイプ削除
   */
  const deletePrototype = useCallback(async (prototypeId: string) => {
    return await prototypesService.deletePrototype(prototypeId);
  }, []);

  return {
    getPrototype,
    updatePrototype,
    deletePrototype,
  };
};
