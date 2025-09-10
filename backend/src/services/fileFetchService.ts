import { GetObjectCommand, GetObjectCommandOutput } from '@aws-sdk/client-s3';
import s3Client from '../config/s3Client';
import { Readable } from 'stream';
import { NotFoundError } from '../errors/CustomError';
import { handleAWSError } from '../utils/awsErrorHandler';
import env from '../config/env';

const bucketName = env.AWS_S3_BUCKET_NAME;

/**
 * S3からファイルを取得するサービス
 * @param key - 取得するファイルのS3キー
 * @returns - ファイルデータのReadableストリーム
 */
export const fetchFileFromS3 = async (key: string): Promise<Readable> => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    const response: GetObjectCommandOutput = await s3Client.send(command);

    // Bodyが存在しない場合はNotFoundエラーをスロー
    if (!response.Body) {
      throw new NotFoundError('S3に指定されたファイルが存在しません');
    }

    return response.Body as Readable;
  } catch (error: unknown) {
    // AWS SDKのエラーをハンドリング
    return handleAWSError(error);
  }
};
