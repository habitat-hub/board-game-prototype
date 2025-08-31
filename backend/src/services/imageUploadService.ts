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
      `ファイルサイズが大きすぎます（最大$${IMAGE_MAX_SIZE_MB}MBまで）`
    );
  }

  // 実ファイル内容からMIMEタイプを判定（拡張子や宣言に依存しない）
  const { fileTypeFromBuffer } = await import('file-type');
  const detected = await fileTypeFromBuffer(file.buffer);
  const mime: string | undefined = detected?.mime ?? file.mimetype;
  if (!mime || !IMAGE_ALLOWED_MIME_TYPES.includes(mime)) {
    throw new ValidationError(
      'サポートされていない画像形式です（JPEG, PNGのみ対応）'
    );
  }

  const cleanName = cleanFileName(file.originalname);
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
  } catch (error: any) {
    // AWS SDKのエラーをハンドリング
    handleAWSError(error);
    throw error; // ここに到達することはないが、TypeScriptの型チェックを通すために必要
  }
};
