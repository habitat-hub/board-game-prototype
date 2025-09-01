import {
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
} from '@aws-sdk/client-s3';
import s3Client from '../config/s3Client';
import { InternalServerError } from '../errors/CustomError';
import { handleAWSError } from '../utils/awsErrorHandler';
import env from '../config/env';

const bucketName = env.AWS_S3_BUCKET_NAME;

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
    const response: DeleteObjectCommandOutput = await s3Client.send(command);
    if (response.$metadata.httpStatusCode !== 204) {
      throw new InternalServerError('S3から画像を削除できませんでした');
    }
    // S3からの削除が成功した場合、何も返さない
    return;
  } catch (error: unknown) {
    // AWS SDKのエラーをハンドリング
    handleAWSError(error);
  }
};
