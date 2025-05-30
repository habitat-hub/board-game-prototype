import ImageModel from '../models/Image';
import { deleteImageFromS3 } from '../services/imageDeleteService';
import { Sequelize } from 'sequelize';

async function cleanUpUnusedImages() {
  // 未使用の画像IDを取得
  const unusedImages = await ImageModel.findAll({
    where: Sequelize.literal(`
        NOT EXISTS (
          SELECT 1 FROM "PartProperties" partProperties
          WHERE partProperties."imageId" = "Image"."id"
        )
      `),
    raw: true,
  });

  // S3から削除
  for (const image of unusedImages) {
    console.log(`Deleting unused image: \n
        ID: ${image.id} \n
        Name: ${image.displayName} \n
        File Size: ${image.fileSize} \n
        Uploader User ID: ${image.uploaderUserId}`);
    try {
      await deleteImageFromS3(image.storagePath);
      await ImageModel.destroy({ where: { id: image.id } });
    } catch (error) {
      console.error(`Failed to delete image ${image.id}`);
    }
  }

  console.log(`Cleaned up ${unusedImages.length} unused images.`);
}

cleanUpUnusedImages().catch(console.error);
