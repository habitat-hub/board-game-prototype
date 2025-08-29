// ファイルアップロード共通の定数
export const FILE_MAX_NAME_LENGTH = 100;
export const FILE_DEFAULT_NAME = 'untitled';

// 画像特有の定数
export const IMAGE_MAX_SIZE_MB = 10; // 10MB
export const IMAGE_MAX_SIZE = IMAGE_MAX_SIZE_MB * 1024 * 1024; // In bytes
export const IMAGE_ALLOWED_MIME_TYPES: ReadonlyArray<string> = ['image/jpeg', 'image/png'];
