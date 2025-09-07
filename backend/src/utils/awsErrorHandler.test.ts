import { describe, it, expect } from 'vitest';
import {
  CustomError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  InternalServerError,
  ServiceUnavailableError,
} from '../errors/CustomError';
import { handleAWSError } from './awsErrorHandler';

describe('handleAWSError', () => {
  it.each([
    ['NoSuchKey', NotFoundError, '指定されたリソースが存在しません', 404],
    ['AccessDenied', UnauthorizedError, 'S3へのアクセスが拒否されました', 401],
    ['InvalidBucketName', ValidationError, '無効なバケット名です', 400],
    [
      'NetworkingError',
      InternalServerError,
      'ネットワークエラーが発生しました',
      500,
    ],
    [
      'ServiceUnavailable',
      ServiceUnavailableError,
      'S3サービスが一時的に利用できません',
      503,
    ],
  ])('handles %s error', (name, _ErrorClass, message, status) => {
    try {
      handleAWSError({ name });
      throw new Error('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(CustomError);
      expect((err as CustomError).statusCode).toBe(status);
      expect((err as Error).message).toBe(message);
    }
  });

  it('defaults to InternalServerError for unknown errors', () => {
    const error = { name: 'UnknownError', message: 'unexpected' };
    try {
      handleAWSError(error);
      throw new Error('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(CustomError);
      expect((err as CustomError).statusCode).toBe(500);
      expect((err as Error).message).toBe(
        'AWS処理中にエラーが発生しました: unexpected'
      );
    }
  });
});
