import { PutObjectCommand, PutObjectCommandOutput } from '@aws-sdk/client-s3';
import s3Client from '../config/s3Client';
import { ValidationError, InternalServerError } from '../errors/CustomError';
import {
  cleanFileName,
  generateS3KeyFromFilename,
} from '../helpers/fileHelper';
import {
  IMAGE_ALLOWED_MIME_TYPES,
  IMAGE_MAX_SIZE,
  IMAGE_MAX_SIZE_MB,
} from '../constants/file';
import ImageModel from '../models/Image';
import { handleAWSError } from '../utils/awsErrorHandler';
import env from '../config/env';
import path from 'path';

const bucketName = env.AWS_S3_BUCKET_NAME;

// 戻り値型を定義（ImageModelから必要なプロパティを抽出）
type UploadResult = Pick<
  ImageModel,
  'displayName' | 'storagePath' | 'contentType' | 'fileSize'
>;

/**
 * S3に画像をアップロードするサービス
 * @param file - アップロードする画像ファイル
 * @returns - アップロードした画像の情報
 */
export const uploadImageToS3 = async (
  file: Express.Multer.File
): Promise<UploadResult> => {
  //最低限のチェック（ファイルサイズ、MIMEタイプ）
  if (file.size > IMAGE_MAX_SIZE) {
    throw new ValidationError(
      `ファイルサイズが大きすぎます（最大${IMAGE_MAX_SIZE_MB}MBまで）`
    );
  }

  // ファイル名はブラウザからlatin1で送られるため、明示的にUTF-8へ変換
  const originalName = Buffer.from(file.originalname, 'latin1').toString(
    'utf8'
  );

  // 拡張子ベースの簡易的なMIMEタイプ判定
  const extension = path.extname(originalName).toLowerCase();
  let mime: string | undefined;
  if (extension === '.jpg' || extension === '.jpeg') {
    mime = 'image/jpeg';
  } else if (extension === '.png') {
    mime = 'image/png';
  }
  if (!mime || !IMAGE_ALLOWED_MIME_TYPES.includes(mime)) {
    throw new ValidationError(
      'サポートされていない画像形式です（JPEG, PNGのみ対応）'
    );
  }

  const cleanName = cleanFileName(originalName);
  const key = generateS3KeyFromFilename(cleanName);
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file.buffer,
    ContentType: mime,
  });
  try {
    const response: PutObjectCommandOutput = await s3Client.send(command);
    //  レスポンスのステータスコードを確認
    if (response.$metadata.httpStatusCode !== 200) {
      throw new InternalServerError('S3へのアップロードに失敗しました');
    }

    return {
      displayName: cleanName,
      storagePath: key,
      contentType: mime,
      fileSize: file.size,
    };
  } catch (error: unknown) {
    // AWS SDKのエラーをハンドリング
    return handleAWSError(error);
  }
};
