import axiosInstance from '../client';
import {
  Prototype,
  PrototypeGroup,
  PrototypeGroupsCreatePayload,
  PrototypeGroupsInstanceCreateData,
  PrototypeGroupsVersionCreateData,
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
    data: PrototypeGroupsVersionCreateData
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
    data: PrototypeGroupsInstanceCreateData
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
};
