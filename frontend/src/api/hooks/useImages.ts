import { useMutation } from '@tanstack/react-query';

import { imagesService } from '@/api/endpoints/images';

import { ImagesDeleteParams } from '../types';

export const useImages = () => {
  const fetchImage = useMutation({
    mutationFn: (imageId: string) => imagesService.fetchImage(imageId),
  });

  const uploadImage = useMutation({
    mutationFn: (data: FormData) => imagesService.uploadImage(data),
  });

  const deleteImage = useMutation({
    mutationFn: ({ imageId, ...params }: ImagesDeleteParams) =>
      imagesService.deleteImage(imageId, params),
  });

  return {
    fetchImage,
    uploadImage,
    deleteImage,
  };
};
