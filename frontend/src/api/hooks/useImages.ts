import { useCallback } from 'react';

import { imagesService } from '@/api/endpoints/images';

export const useImages = () => {
  /**
   * 画像取得
   */
  const fetchImage = useCallback(async (imageId: string) => {
    return await imagesService.fetchImage(imageId);
  }, []);

  /**
   * 画像アップロード
   */
  const uploadImage = useCallback(async (data: FormData) => {
    return await imagesService.uploadImage(data);
  }, []);

  /**
   * 画像削除
   */
  const deleteImage = useCallback(async (imageId: string) => {
    return await imagesService.deleteImage(imageId);
  }, []);

  return {
    fetchImage,
    uploadImage,
    deleteImage,
  };
};
