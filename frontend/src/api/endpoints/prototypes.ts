import axiosInstance from '@/api/client';
import {
  PrototypesCreateData,
  PrototypesCreatePayload,
  PrototypesDeleteData,
  PrototypesDetailData,
  PrototypesDuplicateCreateData,
  PrototypesGroupsAccessUsersListData,
  PrototypesGroupsDetailData,
  PrototypesGroupsInviteCreateData,
  PrototypesGroupsInviteCreatePayload,
  PrototypesGroupsInviteDeleteData,
  PrototypesListData,
  PrototypesPreviewCreateData,
  PrototypesUpdateData,
  PrototypesUpdatePayload,
  PrototypesVersionsCreateData,
  PrototypesVersionsCreatePayload,
  PrototypesVersionsListData,
} from '@/api/types';

export const prototypesService = {
  /**
   * プロトタイプ一覧取得
   */
  getPrototypes: async (): Promise<PrototypesListData> => {
    const response = await axiosInstance.get('/api/prototypes');
    return response.data;
  },
  /**
   * プロトタイプ作成
   */
  createPrototype: async (
    data: PrototypesCreatePayload
  ): Promise<PrototypesCreateData> => {
    const response = await axiosInstance.post('/api/prototypes', data);
    return response.data;
  },
  /**
   * プロトタイプ詳細取得
   */
  getPrototype: async (prototypeId: string): Promise<PrototypesDetailData> => {
    const response = await axiosInstance.get(`/api/prototypes/${prototypeId}`);
    return response.data;
  },
  /**
   * プロトタイプ更新
   */
  updatePrototype: async (
    prototypeId: string,
    data: PrototypesUpdatePayload
  ): Promise<PrototypesUpdateData> => {
    const response = await axiosInstance.put(
      `/api/prototypes/${prototypeId}`,
      data
    );
    return response.data;
  },
  /**
   * プロトタイプ削除
   */
  deletePrototype: async (
    prototypeId: string
  ): Promise<PrototypesDeleteData> => {
    const response = await axiosInstance.delete(
      `/api/prototypes/${prototypeId}`
    );
    return response.data;
  },
  /**
   * プロトタイプバージョン一覧取得
   */
  getPrototypeVersions: async (
    prototypeId: string
  ): Promise<PrototypesVersionsListData> => {
    const response = await axiosInstance.get(
      `/api/prototypes/${prototypeId}/versions`
    );
    return response.data;
  },
  /**
   * 指定されたグループに属するプロトタイプの一覧を取得
   */
  getPrototypesByGroup: async (
    groupId: string
  ): Promise<PrototypesGroupsDetailData> => {
    const response = await axiosInstance.get(
      `/api/prototypes/groups/${groupId}`
    );
    return response.data;
  },
  /**
   * 指定されたグループにアクセス可能なユーザーを取得
   */
  getAccessUsersByGroup: async (
    groupId: string
  ): Promise<PrototypesGroupsAccessUsersListData> => {
    const response = await axiosInstance.get(
      `/api/prototypes/groups/${groupId}/accessUsers`
    );
    return response.data;
  },
  /**
   * 指定されたグループにユーザーを招待
   */
  inviteUserToGroup: async (
    groupId: string,
    data: PrototypesGroupsInviteCreatePayload
  ): Promise<PrototypesGroupsInviteCreateData> => {
    const response = await axiosInstance.post(
      `/api/prototypes/groups/${groupId}/invite`,
      data
    );
    return response.data;
  },
  /**
   * 指定されたグループからユーザーを削除
   */
  deleteUserFromGroup: async (
    groupId: string,
    guestId: string
  ): Promise<PrototypesGroupsInviteDeleteData> => {
    const response = await axiosInstance.delete(
      `/api/prototypes/groups/${groupId}/invite/${guestId}`
    );
    return response.data;
  },
  /**
   * 指定されたプロトタイプを複製
   */
  duplicatePrototype: async (
    prototypeId: string
  ): Promise<PrototypesDuplicateCreateData> => {
    const response = await axiosInstance.post(
      `/api/prototypes/${prototypeId}/duplicate`
    );
    return response.data;
  },
  /**
   * 指定されたプロトタイプのプレビュー版を作成
   */
  createPreview: async (
    prototypeId: string
  ): Promise<PrototypesPreviewCreateData> => {
    const response = await axiosInstance.post(
      `/api/prototypes/${prototypeId}/preview`
    );
    return response.data;
  },
  /**
   * 指定されたプロトタイプのバージョンを作成
   */
  createVersion: async (
    prototypeId: string,
    prototypeVersionId: string,
    data: PrototypesVersionsCreatePayload
  ): Promise<PrototypesVersionsCreateData> => {
    const response = await axiosInstance.post(
      `/api/prototypes/${prototypeId}/versions/${prototypeVersionId}`,
      data
    );
    return response.data;
  },

  /**
   * プロトタイプのバージョンを削除
   */
  deleteVersion: async (
    prototypeId: string,
    prototypeVersionId: string
  ): Promise<PrototypesVersionsCreateData> => {
    const response = await axiosInstance.delete(
      `/api/prototypes/${prototypeId}/versions/${prototypeVersionId}`
    );
    return response.data;
  },
};
