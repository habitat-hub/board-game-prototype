import { GetObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '../config/s3Client';
import { Readable } from 'stream';
import { InternalServerError, NotFoundError } from '../errors/CustomError';

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
    const response = await s3Client.send(command);
    if (!response.Body) {
      throw new NotFoundError('S3に指定された画像が存在しません');
    }
    return response.Body as Readable;
  } catch (error) {
    throw new InternalServerError('S3から画像を取得できませんでした');
  }
};
