import { PutObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '../config/s3Client';
import { ValidationError } from '../errors/CustomError';
import {
  cleanFileName,
  generateS3KeyFromFilename,
} from '../helpers/imageHelper';

const bucketName = process.env.AWS_S3_BUCKET_NAME!;

/**
 * S3に画像をアップロードするサービス
 * @param file - アップロードする画像ファイル
 * @returns - アップロードした画像の情報
 */
export const uploadImageToS3 = async (file: Express.Multer.File) => {
  //最低限のチェック（ファイルサイズ、MIMEタイプ）
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
  if (file.size > MAX_SIZE) {
    throw new ValidationError('ファイルサイズが大きすぎます（最大10MBまで）');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new ValidationError(
      'サポートされていない画像形式です（JPEG, PNG, GIFのみ対応）'
    );
  }

  const cleanName = cleanFileName(file.originalname);
  const key = generateS3KeyFromFilename(cleanName);
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3Client.send(command);

  return {
    displayName: cleanName,
    storagePath: key,
    contentType: file.mimetype,
    fileSize: file.size,
  };
};
