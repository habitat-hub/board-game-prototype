import { GetObjectCommand, GetObjectCommandOutput } from '@aws-sdk/client-s3';
import s3Client from '../config/s3Client';
import { Readable } from 'stream';
import { NotFoundError } from '../errors/CustomError';
import { handleAWSError } from '../utils/awsErrorHandler';

const bucketName = process.env.AWS_S3_BUCKET_NAME!;

/**
 * S3から画像を取得するサービス
 * @param key - 取得する画像のS3キー
 * @returns - 画像データのReadableストリーム
 */
export const fetchImageFromS3 = async (key: string): Promise<Readable> => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    const response: GetObjectCommandOutput = await s3Client.send(command);

    // Bodyが存在しない場合はNotFoundエラーをスロー
    if (!response.Body) {
      throw new NotFoundError('S3に指定された画像が存在しません');
    }

    return response.Body as Readable;
  } catch (error: unknown) {
    // AWS SDKのエラーをハンドリング
    handleAWSError(error);
    throw error; // ここに到達することはないが、TypeScriptの型チェックを通すために必要
  }
};
