import {
  ImagesCreateData,
  ImagesDeleteData,
  ImagesDeleteParams,
} from '@/__generated__/api/client';
import axiosInstance from '@/api/client';

export const imagesService = {
  /*
   * 画像データ取得
   */
  fetchImage: async (imageId: string): Promise<Blob> => {
    const response = await axiosInstance.get(`/api/images/${imageId}`, {
      responseType: 'blob', // Blob形式でレスポンスを取得
    });
    return response.data;
  },
  /*
   * 画像データ更新
   */
  uploadImage: async (data: FormData): Promise<ImagesCreateData> => {
    const response = await axiosInstance.post('/api/images', data);
    return response.data;
  },
  /*
   * 画像データ削除
   */
  deleteImage: async (
    imageId: string,
    params: Omit<ImagesDeleteParams, 'imageId'>
  ): Promise<ImagesDeleteData> => {
    const query = `?prototypeId=${params.prototypeId}&partId=${params.partId}&side=${params.side}&emitUpdate=${params.emitUpdate}`;
    const response = await axiosInstance.delete(
      `/api/images/${imageId}${query}`
    );
    return response.data;
  },
};
