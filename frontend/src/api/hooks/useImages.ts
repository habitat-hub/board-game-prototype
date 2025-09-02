import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { imagesService } from '@/api/endpoints/images';

import { ImagesDeleteParams } from '../types';

export const useImages = () => {
  const queryClient = useQueryClient();

  /**
   * 画像取得
   */
  const fetchImage = useCallback(
    (imageId: string) =>
      queryClient.fetchQuery({
        queryKey: ['images', imageId],
        queryFn: () => imagesService.fetchImage(imageId),
      }),
    [queryClient]
  );

  /**
   * 画像アップロード
   */
  const uploadImageMutation = useMutation({
    mutationFn: (data: FormData) => imagesService.uploadImage(data),
  });
  const uploadImage = useCallback(
    (data: FormData) => uploadImageMutation.mutateAsync(data),
    [uploadImageMutation]
  );

  /**
   * 画像削除
   */
  const deleteImageMutation = useMutation({
    mutationFn: ({
      imageId,
      params,
    }: {
      imageId: string;
      params: Omit<ImagesDeleteParams, 'imageId'>;
    }) => imagesService.deleteImage(imageId, params),
    onSuccess: (_, { imageId }) =>
      queryClient.invalidateQueries({ queryKey: ['images', imageId] }),
  });
  const deleteImage = useCallback(
    (imageId: string, params: Omit<ImagesDeleteParams, 'imageId'>) =>
      deleteImageMutation.mutateAsync({ imageId, params }),
    [deleteImageMutation]
  );

  return {
    fetchImage,
    uploadImage,
    deleteImage,
  };
};
