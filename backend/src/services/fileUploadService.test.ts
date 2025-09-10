import { describe, it, expect, vi, beforeEach } from 'vitest';

// Ensure mocks are registered before importing SUT and mocked modules
vi.mock('../config/s3Client', () => ({
  default: { send: vi.fn() },
}));

import { uploadFileToS3 } from './fileUploadService';
import s3Client from '../config/s3Client';
import { IMAGE_MAX_SIZE } from '../constants/file';
import * as fileHelper from '../helpers/fileHelper';

const mockedSend = s3Client.send as unknown as ReturnType<typeof vi.fn>;
const mockedCleanFileName = vi.spyOn(fileHelper, 'cleanFileName');
const mockedGenerateKey = vi
  .spyOn(fileHelper, 'generateS3KeyFromFilename')
  .mockReturnValue('uploads/test-image.jpg');

beforeEach(() => {
  mockedSend.mockClear();
  mockedCleanFileName.mockClear();
  mockedGenerateKey.mockClear();
});

describe('uploadFileToS3', () => {
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

    const result = await uploadFileToS3(mockFile);

    expect(mockedSend).toHaveBeenCalledOnce();
    expect(result).toEqual({
      displayName: 'test-image.jpg',
      storagePath: 'uploads/test-image.jpg',
      contentType: 'image/jpeg',
      fileSize: buffer.length,
    });
  });

  it('decodes latin1 encoded filename and sanitizes it', async () => {
    const utf8Name = 'ファイル 名.PNG';
    const latin1Name = Buffer.from(utf8Name, 'utf8').toString('latin1');
    const buffer = Buffer.alloc(1);
    const mockFile = {
      originalname: latin1Name,
      size: buffer.length,
      buffer,
    } as unknown as Express.Multer.File;

    mockedSend.mockResolvedValue({ $metadata: { httpStatusCode: 200 } });

    const result = await uploadFileToS3(mockFile);

    expect(mockedCleanFileName).toHaveBeenCalledWith(utf8Name);
    expect(result).toEqual({
      displayName: 'ファイル-名.png',
      storagePath: 'uploads/test-image.jpg',
      contentType: 'image/png',
      fileSize: buffer.length,
    });
  });

  it('throws ValidationError when file is too large', async () => {
    const bigFile = {
      originalname: 'big.jpg',
      size: IMAGE_MAX_SIZE + 1,
      buffer: Buffer.alloc(1),
    } as unknown as Express.Multer.File;

    await expect(uploadFileToS3(bigFile)).rejects.toMatchObject({
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

    await expect(uploadFileToS3(mockFile)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('サポートされていない画像形式'),
    });
    expect(mockedSend).not.toHaveBeenCalled();
  });
});
