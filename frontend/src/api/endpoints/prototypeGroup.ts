import axiosInstance from '../client';
import {
  Prototype,
  PrototypeGroup,
  PrototypeGroupsCreatePayload,
  PrototypeGroupsInstanceCreatePayload,
  PrototypeGroupsInviteCreatePayload,
  PrototypeGroupsVersionCreatePayload,
  User,
} from '../types';

export const prototypeGroupService = {
  /**
   * プロトタイプグループ一覧取得
   */
  getPrototypeGroups: async (): Promise<
    Array<{
      prototypeGroup: PrototypeGroup;
      prototypes: Array<Prototype>;
    }>
  > => {
    const response = await axiosInstance.get('/api/prototype-groups');
    return response.data;
  },
  /**
   * プロトタイプグループ作成
   */
  createPrototypeGroup: async (
    data: PrototypeGroupsCreatePayload
  ): Promise<PrototypeGroup> => {
    const response = await axiosInstance.post('/api/prototype-groups', data);
    return response.data;
  },
  /**
   * プロトタイプバージョン作成
   */
  createPrototypeVersion: async (
    prototypeGroupId: string,
    data: PrototypeGroupsVersionCreatePayload
  ): Promise<Prototype> => {
    const response = await axiosInstance.post(
      `/api/prototype-groups/${prototypeGroupId}/version`,
      data
    );
    return response.data;
  },
  /**
   * プロトタイプインスタンス作成
   */
  createPrototypeInstance: async (
    prototypeGroupId: string,
    prototypeVersionId: string,
    data: PrototypeGroupsInstanceCreatePayload
  ): Promise<Prototype> => {
    const response = await axiosInstance.post(
      `/api/prototype-groups/${prototypeGroupId}/${prototypeVersionId}/instance`,
      data
    );
    return response.data;
  },
  /**
   * プロトタイプグループに属するプロトタイプ一覧取得
   */
  getPrototypeGroup: async (
    prototypeGroupId: string
  ): Promise<{
    prototypeGroup: PrototypeGroup;
    prototypes: Array<Prototype>;
  }> => {
    const response = await axiosInstance.get(
      `/api/prototype-groups/${prototypeGroupId}`
    );
    return response.data;
  },
  /**
   * プロトタイプグループ削除
   */
  deletePrototypeGroup: async (prototypeGroupId: string): Promise<void> => {
    const response = await axiosInstance.delete(
      `/api/prototype-groups/${prototypeGroupId}`
    );
    return response.data;
  },
  /**
   * プロトタイプグループの参加ユーザー取得
   */
  getAccessUsersByGroup: async (prototypeGroupId: string): Promise<User[]> => {
    const response = await axiosInstance.get(
      `/api/prototype-groups/${prototypeGroupId}/access-users`
    );
    return response.data;
  },
  /**
   * プロトタイプグループに招待する
   */
  inviteToPrototypeGroup: async (
    prototypeGroupId: string,
    data: PrototypeGroupsInviteCreatePayload
  ): Promise<void> => {
    const response = await axiosInstance.post(
      `/api/prototype-groups/${prototypeGroupId}/invite`,
      data
    );
    return response.data;
  },

  /**
   * プロトタイプグループから招待を削除する
   */
  deleteInviteFromPrototypeGroup: async (
    prototypeGroupId: string,
    guestId: string
  ): Promise<void> => {
    const response = await axiosInstance.delete(
      `/api/prototype-groups/${prototypeGroupId}/invite/${guestId}`
    );
    return response.data;
  },
};
