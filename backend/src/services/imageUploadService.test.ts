import { describe, it, expect, vi, beforeEach } from 'vitest';

// Ensure mocks are registered before importing SUT and mocked modules
vi.mock('../config/s3Client', () => ({
  default: { send: vi.fn() },
}));

vi.mock('../helpers/fileHelper', () => ({
  cleanFileName: vi.fn((name: string) => name),
  generateS3KeyFromFilename: vi.fn(() => 'uploads/test-image.jpg'),
}));

import { uploadImageToS3 } from './imageUploadService';
import s3Client from '../config/s3Client';
import { IMAGE_MAX_SIZE } from '../constants/file';
import {
  cleanFileName,
  generateS3KeyFromFilename,
} from '../helpers/fileHelper';

const mockedSend = s3Client.send as unknown as ReturnType<typeof vi.fn>;
const mockedCleanFileName = cleanFileName as unknown as ReturnType<
  typeof vi.fn
>;
const mockedGenerateKey = generateS3KeyFromFilename as unknown as ReturnType<
  typeof vi.fn
>;

beforeEach(() => {
  mockedSend.mockClear();
  mockedCleanFileName.mockClear();
  mockedGenerateKey.mockClear();
});

describe('uploadImageToS3', () => {
  it('uploads JPEG file and returns metadata', async () => {
    const jpgBase64 =
      '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAQABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAUGB//EABUBAQEAAAAAAAAAAAAAAAAAAAEF/8QAFQEBAQAAAAAAAAAAAAAAAAAAAgP/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwD8/wD/AP/Z';
    const buffer = Buffer.from(jpgBase64, 'base64');
    const mockFile = {
      originalname: 'test-image.jpg',
      size: buffer.length,
      buffer,
    } as unknown as Express.Multer.File;

    mockedSend.mockResolvedValue({ $metadata: { httpStatusCode: 200 } });

    const result = await uploadImageToS3(mockFile);

    expect(mockedSend).toHaveBeenCalledOnce();
    expect(result).toEqual({
      displayName: 'test-image.jpg',
      storagePath: 'uploads/test-image.jpg',
      contentType: 'image/jpeg',
      fileSize: buffer.length,
    });
  });

  it('throws ValidationError when file is too large', async () => {
    const bigFile = {
      originalname: 'big.jpg',
      size: IMAGE_MAX_SIZE + 1,
      buffer: Buffer.alloc(1),
    } as unknown as Express.Multer.File;

    await expect(uploadImageToS3(bigFile)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('ファイルサイズが大きすぎます'),
    });
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it('throws ValidationError for unsupported extension', async () => {
    const buffer = Buffer.from('GIF89a');
    const mockFile = {
      originalname: 'image.gif',
      size: buffer.length,
      buffer,
    } as unknown as Express.Multer.File;

    await expect(uploadImageToS3(mockFile)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('サポートされていない画像形式'),
    });
    expect(mockedSend).not.toHaveBeenCalled();
  });
});
