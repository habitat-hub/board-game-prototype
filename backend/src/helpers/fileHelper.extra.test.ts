import { describe, it, expect } from 'vitest';
import { cleanFileName, generateS3KeyFromFilename } from './fileHelper';
import { FILE_DEFAULT_NAME } from '../constants/file';

describe('cleanFileName', () => {
  it('replaces spaces with hyphens and lowercases extension', () => {
    expect(cleanFileName('my file name.PDF')).toBe('my-file-name.pdf');
  });

  it('preserves unicode characters', () => {
    expect(cleanFileName('ファイル 名🚀.PNG')).toBe('ファイル-名🚀.png');
  });

  it('removes dangerous characters and falls back to default when empty', () => {
    expect(cleanFileName('\\/:*?"<>|.GIF')).toBe(`${FILE_DEFAULT_NAME}.gif`);
  });
});

describe('generateS3KeyFromFilename', () => {
  it('generates unique S3 keys for the same filename', () => {
    const fileName = 'document.txt';
    const key1 = generateS3KeyFromFilename(fileName);
    const key2 = generateS3KeyFromFilename(fileName);
    expect(key1).not.toBe(key2);
    expect(key1).toMatch(/^uploads\/[0-9a-f-]+-document\.txt$/);
    expect(key2).toMatch(/^uploads\/[0-9a-f-]+-document\.txt$/);
  });
});
