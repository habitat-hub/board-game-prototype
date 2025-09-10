import FileModel from '../models/File';
import { deleteFileFromS3 } from './fileDeleteService';
import sequelize from '../models/index';
import { QueryTypes } from 'sequelize';

/**
 * ファイルが他で使われていなければDBとストレージから削除
 * @param fileId - 削除対象のファイルID
 * @returns { deleted: boolean }
 */
export const cleanupFileIfUnused = async (
  fileId: string,
  partId: string,
  side: 'front' | 'back'
): Promise<{ deleted: boolean }> => {
  const [result] = (await sequelize.query(
    `SELECT COUNT(*) AS "count" FROM "PartProperties" WHERE "fileId" = :fileId`,
    { replacements: { fileId }, type: QueryTypes.SELECT }
  )) as [{ count: number | string }];

  // countはDBによってstring型で返る場合があるので数値化
  const count =
    typeof result.count === 'string'
      ? parseInt(result.count, 10)
      : result.count;

  // 他のパーツでもそのfileIdが使われている場合
  if (count > 1) {
    // PartPropertyのfileIdのみクリアする
    await sequelize.query(
      `UPDATE "PartProperties" SET "fileId" = NULL WHERE "partId" = :partId AND "side" = :side`,
      {
        replacements: { partId, side },
        type: QueryTypes.UPDATE,
      }
    );
    // ファイルは削除しない
    return { deleted: false };
  }

  // S3とDBから削除
  const file = await FileModel.findByPk(fileId);
  if (file) {
    await deleteFileFromS3(file.storagePath);
    // file.destroy()により、PartProperty.fileIdはDBの
    // ON DELETE SET NULL制約により自動的にNULLに更新される
    await file.destroy();
    return { deleted: true };
  }
  // ファイルが見つからない場合は何もしない
  console.warn(`File with ID ${fileId} not found for cleanup.`);
  return { deleted: false };
};
