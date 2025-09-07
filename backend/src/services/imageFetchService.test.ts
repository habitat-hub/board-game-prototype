import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Readable } from 'stream';
import { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { fetchImageFromS3 } from './imageFetchService';
import s3Client from '../config/s3Client';
import { NotFoundError } from '../errors/CustomError';
import { handleAWSError } from '../utils/awsErrorHandler';

vi.mock('../config/s3Client', () => ({
  default: { send: vi.fn() },
}));
vi.mock('../utils/awsErrorHandler', () => ({
  handleAWSError: vi.fn((error: unknown) => {
    throw error;
  }),
}));

const mockedSend = s3Client.send as unknown as ReturnType<typeof vi.fn>;
const mockedHandleError = handleAWSError as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockedSend.mockReset();
  mockedHandleError.mockClear();
});

describe('fetchImageFromS3', () => {
  it('returns stream when object exists', async () => {
    const stream = Readable.from('test');
    mockedSend.mockResolvedValue({
      Body: stream,
    } as unknown as GetObjectCommandOutput);

    const result = await fetchImageFromS3('key');

    expect(result).toBe(stream);
  });

  it('throws NotFoundError when Body missing', async () => {
    mockedSend.mockResolvedValue({} as unknown as GetObjectCommandOutput);

    await expect(fetchImageFromS3('key')).rejects.toBeInstanceOf(NotFoundError);
    await expect(fetchImageFromS3('key')).rejects.toHaveProperty(
      'message',
      'S3に指定された画像が存在しません'
    );
    await expect(fetchImageFromS3('key')).rejects.toHaveProperty(
      'statusCode',
      404
    );
  });
});
