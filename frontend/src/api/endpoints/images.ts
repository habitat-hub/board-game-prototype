import axiosInstance from '@/api/client';

import { ImagesCreateData, ImagesDeleteData } from '../types';

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
  deleteImage: async (imageId: string): Promise<ImagesDeleteData> => {
    const response = await axiosInstance.delete(`/api/images/${imageId}`);
    return response.data;
  },
};
