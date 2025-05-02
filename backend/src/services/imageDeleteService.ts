import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '../config/s3Client';
import { NotFoundError, InternalServerError } from '../errors/CustomError';

const bucketName = process.env.AWS_S3_BUCKET_NAME!;

/**
 * S3から画像を削除するサービス
 * @param key - 削除する画像のS3キー（storagePath）
 * @returns - 削除が成功した場合は何も返さない
 */
export const deleteImageFromS3 = async (key: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    const response = await s3Client.send(command);
    if (response.$metadata.httpStatusCode !== 204) {
      throw new InternalServerError('S3から画像を削除できませんでした');
    }
    // S3からの削除が成功した場合、何も返さない
    return;
  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
      throw new NotFoundError('指定された画像が存在しません');
    }
    throw new InternalServerError('画像の削除処理に失敗しました');
  }
};
