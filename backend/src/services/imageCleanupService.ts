import ImageModel from '../models/Image';
import PartPropertyModel from '../models/PartProperty';
import { deleteImageFromS3 } from './imageDeleteService';
import sequelize from '../models/index';

/**
 * 画像が他で使われていなければDBとストレージから削除
 * @param imageId - 削除対象の画像ID
 * @returns { deleted: boolean }
 */
export const cleanupImageIfUnused = async (
  imageId: string,
  partId: string,
  side: 'front' | 'back'
): Promise<{ deleted: boolean }> => {
  return await sequelize.transaction(async (transaction) => {
    const count = await PartPropertyModel.count({
      where: { imageId },
      transaction,
    });

    // 他のパーツでもそのimageIdが使われている場合
    if (count > 1) {
      // PartPropertyのimageIdのみクリアする
      await PartPropertyModel.update(
        { imageId: null },
        { where: { partId, side }, transaction }
      );
      // 画像は削除しない
      return { deleted: false };
    }

    // S3とDBから削除
    const image = await ImageModel.findByPk(imageId, { transaction });
    if (image) {
      await deleteImageFromS3(image.storagePath);
      // image.destroy()により、PartProperty.imageIdはDBの
      // ON DELETE SET NULL制約により自動的にNULLに更新される
      await image.destroy({ transaction });
      return { deleted: true };
    }
    // 画像が見つからない場合は何もしない
    console.warn(`Image with ID ${imageId} not found for cleanup.`);
    return { deleted: false };
  });
};
