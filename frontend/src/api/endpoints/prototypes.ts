import {
  PrototypesDeleteData,
  PrototypesDetailData,
  PrototypesUpdateData,
  PrototypesUpdatePayload,
} from '@/__generated__/api/client';
import axiosInstance from '@/api/client';

export const prototypesService = {
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
};
