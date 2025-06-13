import { useCallback } from 'react';

import { prototypeGroupService } from '@/api/endpoints/prototypeGroup';
import {
  PrototypeGroupsCreatePayload,
  PrototypeGroupsInstanceCreatePayload,
  PrototypeGroupsInviteCreatePayload,
  PrototypeGroupsVersionCreatePayload,
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
      data: PrototypeGroupsVersionCreatePayload
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
      data: PrototypeGroupsInstanceCreatePayload
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

  /**
   * プロトタイプグループの参加ユーザー取得
   */
  const getAccessUsersByGroup = useCallback(
    async (prototypeGroupId: string) => {
      return await prototypeGroupService.getAccessUsersByGroup(
        prototypeGroupId
      );
    },
    []
  );

  /**
   * プロトタイプグループに招待する
   */
  const inviteToPrototypeGroup = useCallback(
    async (
      prototypeGroupId: string,
      data: PrototypeGroupsInviteCreatePayload
    ) => {
      return await prototypeGroupService.inviteToPrototypeGroup(
        prototypeGroupId,
        data
      );
    },
    []
  );

  /**
   * プロトタイプグループから招待を削除する
   */
  const deleteInviteFromPrototypeGroup = useCallback(
    async (prototypeGroupId: string, guestId: string) => {
      return await prototypeGroupService.deleteInviteFromPrototypeGroup(
        prototypeGroupId,
        guestId
      );
    },
    []
  );

  return {
    getPrototypeGroups,
    createPrototypeGroup,
    createPrototypeVersion,
    createPrototypeInstance,
    getPrototypeGroup,
    getAccessUsersByGroup,
    inviteToPrototypeGroup,
    deleteInviteFromPrototypeGroup,
    deletePrototypeGroup,
  };
};
