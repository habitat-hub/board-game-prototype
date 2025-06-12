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
} from '../constants/fileConstants';
import FileModel from '../models/File';
import { handleAWSError } from '../utils/awsErrorHandler';

const bucketName = process.env.AWS_S3_BUCKET_NAME!;

// 戻り値型を定義（FileModelから必要なプロパティを抽出）
type UploadResult = Pick<
  FileModel,
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
  try {
    const response: PutObjectCommandOutput = await s3Client.send(command);
    //  レスポンスのステータスコードを確認
    if (response.$metadata.httpStatusCode !== 200) {
      throw new InternalServerError('S3へのアップロードに失敗しました');
    }

    return {
      displayName: cleanName,
      storagePath: key,
      contentType: file.mimetype,
      fileSize: file.size,
    };
  } catch (error: any) {
    // AWS SDKのエラーをハンドリング
    handleAWSError(error);
    throw error; // ここに到達することはないが、TypeScriptの型チェックを通すために必要
  }
};
