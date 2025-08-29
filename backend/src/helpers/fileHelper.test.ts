import { describe, it, expect } from 'vitest';
import { splitNameAndExtension, trimMaxLength } from './fileHelper';
import { FILE_MAX_NAME_LENGTH, FILE_DEFAULT_NAME } from '../constants/file';

describe('splitNameAndExtension', () => {
  it('splits filename with extension', () => {
    expect(splitNameAndExtension('photo.png')).toEqual({
      baseName: 'photo',
      extension: '.png',
    });
  });

  it('handles filename without extension', () => {
    expect(splitNameAndExtension('archive')).toEqual({
      baseName: 'archive',
      extension: '',
    });
  });

  it('lowercases the extension', () => {
    expect(splitNameAndExtension('UPPER.JPG')).toEqual({
      baseName: 'UPPER',
      extension: '.jpg',
    });
  });
});

describe('trimMaxLength', () => {
  it('returns original name when within limit', () => {
    expect(trimMaxLength({ baseName: 'short', extension: '.txt' })).toBe(
      'short.txt'
    );
  });

  it('trims baseName to stay within max length', () => {
    const longBase = 'a'.repeat(FILE_MAX_NAME_LENGTH);
    const result = trimMaxLength({ baseName: longBase, extension: '.png' });
    expect(result.length).toBe(FILE_MAX_NAME_LENGTH);
    expect(result.endsWith('.png')).toBe(true);
  });

  it('uses default name when baseName becomes empty', () => {
    const result = trimMaxLength({ baseName: '', extension: '.gif' });
    expect(result).toBe(`${FILE_DEFAULT_NAME}.gif`);
  });
});
