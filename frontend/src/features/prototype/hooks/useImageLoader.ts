import { useCallback, useEffect, useState } from 'react';

import { useImages } from '@/api/hooks/useImages';
import { PartProperty as PropertyType } from '@/api/types';
import { saveImageToIndexedDb, getImageFromIndexedDb } from '@/utils/db';

/**
 * 画像の読み込みと管理を行うカスタムフック
 * IndexedDBからの画像読み込み、キャッシュがない場合のS3からの取得、
 * そして特定のプロパティに紐づく画像のフィルタリングを処理する
 */
export const useImageLoader = (properties: PropertyType[]) => {
  const { fetchImage } = useImages();
  const [images, setImages] = useState<Record<string, string>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * 画像をIndexedDBから取得し、キャッシュがない場合はS3から取得してIndexedDBに保存
   */
  useEffect(() => {
    const loadImages = async () => {
      try {
        setIsLoading(true);
        // 重複を除去したimageIdのリスト
        const uniqueImageIds = Array.from(
          new Set(properties.map((prop) => prop.imageId).filter(Boolean))
        ) as string[];

        // 画像URLを保持する配列
        const urlsToRevoke: string[] = [];
        const imageResults = [];

        // 各画像を取得
        for (const imageId of uniqueImageIds) {
          let imageBlob = await getImageFromIndexedDb(imageId);

          if (!imageBlob) {
            imageBlob = await fetchImage(imageId);
            await saveImageToIndexedDb(imageId, imageBlob);
          }

          const url = URL.createObjectURL(imageBlob);
          imageResults.push({ imageId, url });
          urlsToRevoke.push(url);
        }

        // 画像データをステートに保存
        setImages(imageResults.map(({ imageId, url }) => ({ [imageId]: url })));
        setIsLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to load images')
        );
        setIsLoading(false);
      }
    };

    loadImages();

    // クリーンアップ処理
    return () => {
      images.forEach((img) => {
        const url = Object.values(img)[0];
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [fetchImage, images, properties]);

  /**
   * propertiesに紐づく画像を取得
   */
  const getFilteredImages = useCallback(
    (filteredProperties: PropertyType[]): Record<string, string>[] => {
      return filteredProperties
        .filter((prop) => prop.imageId) // imageIdがあるものだけにフィルタリング
        .map((prop) => {
          const imageId = prop.imageId!;
          const targetImage = images.find((img) => img[imageId]);
          return targetImage ? { [imageId]: targetImage[imageId] } : null;
        })
        .filter(Boolean) as Record<string, string>[];
    },
    [images]
  );

  return { images, getFilteredImages, isLoading, error };
};
