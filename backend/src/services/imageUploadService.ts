import { PutObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '../config/s3Client';
import { ValidationError } from '../errors/CustomError';
import {
  cleanFileName,
  generateS3KeyFromFilename,
} from '../helpers/fileHelper';
import {
  IMAGE_ALLOWED_MIME_TYPES,
  IMAGE_MAX_SIZE,
} from '../constants/fileConstants';

const bucketName = process.env.AWS_S3_BUCKET_NAME!;

/**
 * S3に画像をアップロードするサービス
 * @param file - アップロードする画像ファイル
 * @returns - アップロードした画像の情報
 */
export const uploadImageToS3 = async (file: Express.Multer.File) => {
  //最低限のチェック（ファイルサイズ、MIMEタイプ）
  if (file.size > IMAGE_MAX_SIZE) {
    throw new ValidationError('ファイルサイズが大きすぎます（最大10MBまで）');
  }

  if (!IMAGE_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
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
