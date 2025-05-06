import {
  NotFoundError,
  InternalServerError,
  UnauthorizedError,
  ValidationError,
  ServiceUnavailableError,
} from '../errors/CustomError';

/**
 * AWS SDKのエラーをハンドリングして適切なCustomErrorをスローする
 * @param error - AWS SDKがスローしたエラー
 */
export const handleAWSError = (error: any): never => {
  switch (error.name) {
    case 'NoSuchKey':
      throw new NotFoundError('指定されたリソースが存在しません');
    case 'AccessDenied':
      throw new UnauthorizedError('S3へのアクセスが拒否されました');
    case 'InvalidBucketName':
      throw new ValidationError('無効なバケット名です');
    case 'NetworkingError':
      throw new InternalServerError('ネットワークエラーが発生しました');
    case 'ServiceUnavailable':
      throw new ServiceUnavailableError('S3サービスが一時的に利用できません');
    default:
      throw new InternalServerError(
        `AWS処理中にエラーが発生しました: ${error.message}`
      );
  }
};
