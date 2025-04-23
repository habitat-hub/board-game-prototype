import { useCallback } from 'react';

import { prototypesService } from '@/api/endpoints/prototypes';
import {
  PrototypesCreatePayload,
  PrototypesUpdatePayload,
  PrototypesVersionsCreatePayload,
  PrototypesGroupsInviteCreatePayload,
} from '@/api/types';

export const usePrototypes = () => {
  /**
   * プロトタイプ一覧取得
   */
  const getPrototypes = useCallback(async () => {
    return await prototypesService.getPrototypes();
  }, []);

  /**
   * プロトタイプ作成
   */
  const createPrototype = useCallback(async (data: PrototypesCreatePayload) => {
    return await prototypesService.createPrototype(data);
  }, []);

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

  /**
   * プロトタイプバージョン一覧取得
   */
  const getPrototypeVersions = useCallback(async (prototypeId: string) => {
    return await prototypesService.getPrototypeVersions(prototypeId);
  }, []);

  /**
   * 指定されたグループに属するプロトタイプの一覧を取得
   */
  const getPrototypesByGroup = useCallback(async (groupId: string) => {
    return await prototypesService.getPrototypesByGroup(groupId);
  }, []);

  /**
   * 指定されたグループにアクセス可能なユーザーを取得
   */
  const getAccessUsersByGroup = useCallback(async (groupId: string) => {
    return await prototypesService.getAccessUsersByGroup(groupId);
  }, []);

  /**
   * 指定されたグループにユーザーを招待
   */
  const inviteUserToGroup = useCallback(
    async (groupId: string, data: PrototypesGroupsInviteCreatePayload) => {
      return await prototypesService.inviteUserToGroup(groupId, data);
    },
    []
  );

  /**
   * 指定されたグループからユーザーを削除
   */
  const deleteUserFromGroup = useCallback(
    async (groupId: string, guestId: string) => {
      return await prototypesService.deleteUserFromGroup(groupId, guestId);
    },
    []
  );

  /**
   * 指定されたプロトタイプを複製
   */
  const duplicatePrototype = useCallback(async (prototypeId: string) => {
    return await prototypesService.duplicatePrototype(prototypeId);
  }, []);

  /**
   * 指定されたプロトタイプのプレビュー版を作成
   */
  const createPreview = useCallback(async (prototypeId: string) => {
    return await prototypesService.createPreview(prototypeId);
  }, []);

  /**
   * 指定されたプロトタイプのバージョンを作成
   */
  const createVersion = useCallback(
    async (
      prototypeId: string,
      prototypeVersionId: string,
      data: PrototypesVersionsCreatePayload
    ) => {
      return await prototypesService.createVersion(
        prototypeId,
        prototypeVersionId,
        data
      );
    },
    []
  );

  /**
   * 指定されたプロトタイプバージョンを削除
   */
  const deleteVersion = useCallback(
    async (prototypeId: string, prototypeVersionId: string) => {
      return await prototypesService.deleteVersion(
        prototypeId,
        prototypeVersionId
      );
    },
    []
  );

  return {
    getPrototypes,
    createPrototype,
    getPrototype,
    updatePrototype,
    deletePrototype,
    getPrototypeVersions,
    getPrototypesByGroup,
    getAccessUsersByGroup,
    inviteUserToGroup,
    deleteUserFromGroup,
    duplicatePrototype,
    createPreview,
    createVersion,
    deleteVersion,
  };
};
