import FileModel from '../models/File';
import { deleteFileFromS3 } from '../services/fileDeleteService';
import { Sequelize } from 'sequelize';

async function cleanUpUnusedFiles() {
  // 未使用のファイルIDを取得
  const unusedFiles = await FileModel.findAll({
    where: Sequelize.literal(`
        NOT EXISTS (
          SELECT 1 FROM "PartProperties" partProperties
          WHERE partProperties."fileId" = "File"."id"
        )
      `),
    raw: true,
  });

  // S3から削除
  for (const file of unusedFiles) {
    console.log(
      `Deleting unused file: \n        ID: ${file.id} \n        Name: ${file.displayName} \n        File Size: ${file.fileSize} \n        Uploader User ID: ${file.uploaderUserId}`
    );
    try {
      await deleteFileFromS3(file.storagePath);
      await FileModel.destroy({ where: { id: file.id } });
    } catch (error) {
      console.error(`Failed to delete file ${file.id}`, error);
    }
  }

  console.log(`Cleaned up ${unusedFiles.length} unused files.`);
}

cleanUpUnusedFiles().catch(console.error);
