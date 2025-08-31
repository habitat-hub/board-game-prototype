import { v4 as uuidv4 } from 'uuid';
import { FILE_DEFAULT_NAME, FILE_MAX_NAME_LENGTH } from '../constants/file';

type FileNameParts = {
  baseName: string;
  extension: string;
};

/**
 * ファイル名をサニタイズして、拡張子を小文字に変換し、最大長さでトリムします。
 * @param originalName - 元のファイル名
 * @returns サニタイズされたファイル名
 */
export function cleanFileName(originalName: string): string {
  // 拡張子を分離
  const { baseName: rawBaseName, extension: rawExtension } =
    splitNameAndExtension(originalName);
  // baseName をサニタイズ
  const sanitizedBase = rawBaseName
    .replace(/[/\\?%*:|"<>]/g, '') // 危険な記号を除去
    .replace(/\s+/g, '-') // 空白をハイフンに
    .trim(); // 前後の空白を除去

  // 拡張子をlowercase に変換
  const lowerExtension = rawExtension.toLowerCase();
  // 最大文字長さでトリム
  const finalName = trimMaxLength({
    baseName: sanitizedBase,
    extension: lowerExtension,
  });
  // 結合
  return finalName;
}

/**
 * ファイル名が最大長を超えないように調整します。
 * @param baseName - ベース名
 * @param extension - 拡張子
 * @returns 調整されたファイル名
 */
export function trimMaxLength({ baseName, extension }: FileNameParts): string {
  // 拡張子を分離
  const maxBaseLength = FILE_MAX_NAME_LENGTH - extension.length;
  // baseName を切り詰め（サロゲートペアなどを壊さないように文字単位で）
  const trimmedBase = [...baseName].slice(0, maxBaseLength).join('');
  // ファイル名が空になるのを防ぐ（記号だけだったケース）
  const finalBase = trimmedBase || FILE_DEFAULT_NAME;
  return `${finalBase}${extension}`;
}

/**
 * ファイル名を分割して、ベース名と拡張子を取得します。
 * @param fileName - ファイル名
 * @returns ベース名と拡張子
 */
export function splitNameAndExtension(fileName: string): FileNameParts {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return { baseName: fileName, extension: '' };
  }

  return {
    baseName: fileName.slice(0, lastDotIndex),
    extension: fileName.slice(lastDotIndex).toLowerCase(),
  };
}

/**
 * ファイル名からS3キーを生成します。
 * @param fileName - ファイル名
 * @returns S3キー
 */
export function generateS3KeyFromFilename(fileName: string) {
  return `uploads/${uuidv4()}-${fileName}`;
}
