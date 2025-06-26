import axiosInstance from '../client';
import {
  Prototype,
  PrototypeGroup,
  PrototypeGroupsCreatePayload,
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
  ): Promise<{
    prototypeGroup: PrototypeGroup;
    prototypes: Array<Prototype>;
  }> => {
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

  /**
   * プロトタイプグループのロール一覧取得
   */
  getPrototypeGroupRoles: async (
    prototypeGroupId: string
  ): Promise<
    Array<{
      userId: string;
      user: User;
      roles: Array<{ name: string; description: string }>;
    }>
  > => {
    const response = await axiosInstance.get(
      `/api/prototype-groups/${prototypeGroupId}/roles`
    );
    return response.data;
  },

  /**
   * プロトタイプグループにロール追加
   */
  addRoleToPrototypeGroup: async (
    prototypeGroupId: string,
    data: { userId: string; roleName: string }
  ): Promise<void> => {
    const response = await axiosInstance.post(
      `/api/prototype-groups/${prototypeGroupId}/roles`,
      data
    );
    return response.data;
  },

  /**
   * プロトタイプグループからロール削除
   */
  removeRoleFromPrototypeGroup: async (
    prototypeGroupId: string,
    userId: string
  ): Promise<void> => {
    const response = await axiosInstance.delete(
      `/api/prototype-groups/${prototypeGroupId}/roles/${userId}`
    );
    return response.data;
  },

  /**
   * プロトタイプグループのロール更新
   */
  updateRoleInPrototypeGroup: async (
    prototypeGroupId: string,
    userId: string,
    data: { roleName: string }
  ): Promise<void> => {
    const response = await axiosInstance.put(
      `/api/prototype-groups/${prototypeGroupId}/roles/${userId}`,
      data
    );
    return response.data;
  },
};
