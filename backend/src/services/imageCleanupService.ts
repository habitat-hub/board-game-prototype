import ImageModel from '../models/Image';
import { deleteImageFromS3 } from './imageDeleteService';
import sequelize from '../models/index';
import { QueryTypes } from 'sequelize';

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
  // 他で使われていないかチェック（COUNT(*)が2以上の場合に削除する）
  const [result] = (await sequelize.query(
    `SELECT COUNT(*) AS "count" FROM "PartProperties" WHERE "imageId" = :imageId`,
    { replacements: { imageId }, type: QueryTypes.SELECT }
  )) as [{ count: number | string }];

  // countはDBによってstring型で返る場合があるので数値化
  const count =
    typeof result.count === 'string'
      ? parseInt(result.count, 10)
      : result.count;

  if (count > 1) {
    // PartPropertyのimageIdのみクリアする
    await sequelize.query(
      `UPDATE "PartProperties" SET "imageId" = NULL WHERE "partId" = :partId AND "side" = :side`,
      {
        replacements: { partId, side },
        type: QueryTypes.UPDATE,
      }
    );
    // 画像は削除しない
    return { deleted: false };
  }

  // S3とDBから削除
  const image = await ImageModel.findByPk(imageId);
  if (image) {
    await deleteImageFromS3(image.storagePath);
    // image.destroy()により、PartProperty.imageIdはDBの
    // ON DELETE SET NULL制約により自動的にNULLに更新される
    await image.destroy();
    return { deleted: true };
  }
  // 画像が見つからない場合は何もしない
  console.warn(`Image with ID ${imageId} not found for cleanup.`);
  return { deleted: false };
};
