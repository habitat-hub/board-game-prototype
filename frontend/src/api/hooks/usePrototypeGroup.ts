import { useCallback } from 'react';

import { prototypeGroupService } from '@/api/endpoints/prototypeGroup';
import {
  PrototypeGroupsCreatePayload,
  PrototypeGroupsVersionCreateData,
  PrototypeGroupsInstanceCreateData,
} from '@/api/types';

export const usePrototypeGroup = () => {
  /**
   * プロトタイプグループ一覧取得
   */
  const getPrototypeGroups = useCallback(async () => {
    return await prototypeGroupService.getPrototypeGroups();
  }, []);

  /**
   * プロトタイプグループ作成
   */
  const createPrototypeGroup = useCallback(
    async (data: PrototypeGroupsCreatePayload) => {
      return await prototypeGroupService.createPrototypeGroup(data);
    },
    []
  );

  /**
   * プロトタイプバージョン作成
   */
  const createPrototypeVersion = useCallback(
    async (
      prototypeGroupId: string,
      data: PrototypeGroupsVersionCreateData
    ) => {
      return await prototypeGroupService.createPrototypeVersion(
        prototypeGroupId,
        data
      );
    },
    []
  );

  /**
   * プロトタイプインスタンス作成
   */
  const createPrototypeInstance = useCallback(
    async (
      prototypeGroupId: string,
      prototypeVersionId: string,
      data: PrototypeGroupsInstanceCreateData
    ) => {
      return await prototypeGroupService.createPrototypeInstance(
        prototypeGroupId,
        prototypeVersionId,
        data
      );
    },
    []
  );

  /**
   * プロトタイプグループ詳細取得
   */
  const getPrototypeGroup = useCallback(async (prototypeGroupId: string) => {
    return await prototypeGroupService.getPrototypeGroup(prototypeGroupId);
  }, []);

  /**
   * プロトタイプグループ削除
   */
  const deletePrototypeGroup = useCallback(async (prototypeGroupId: string) => {
    return await prototypeGroupService.deletePrototypeGroup(prototypeGroupId);
  }, []);

  return {
    getPrototypeGroups,
    createPrototypeGroup,
    createPrototypeVersion,
    createPrototypeInstance,
    getPrototypeGroup,
    deletePrototypeGroup,
  };
};
