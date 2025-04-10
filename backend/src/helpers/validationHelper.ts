import PartPropertyModel from '../models/PartProperty';

// バリデーションタイプの定義
type ValidationType =
  | 'numberValidation'
  | 'stringValidation'
  | 'emailValidation';

// バリデーション結果の型
interface ValidationResult {
  isValid: boolean;
  errorMessage: string;
}

/**
 * 数値バリデーションを行う関数
 * @param value - 検証対象の値
 * @returns バリデーション結果（isValid と errorMessage）
 */
const checkNumber = (value: any, includesMinus = false): ValidationResult => {
  if (typeof value !== 'number') {
    return { isValid: false, errorMessage: '数値を入力してください。' };
  }
  if (!includesMinus && value < 0) {
    return { isValid: false, errorMessage: '0以上の数値を入力してください。' };
  }
  return { isValid: true, errorMessage: '' };
};

/**
 * 文字列バリデーションを行う関数
 * @param value - 検証対象の値
 * @returns バリデーション結果（isValid と errorMessage）
 */
const checkString = (value: any): ValidationResult => {
  if (typeof value !== 'string') {
    return { isValid: false, errorMessage: '文字列を入力してください。' };
  }
  if (value.trim() === '') {
    return { isValid: false, errorMessage: '空白の文字列は無効です。' };
  }
  return { isValid: true, errorMessage: '' };
};

/**
 * メールアドレスバリデーションを行う関数
 * @param value - 検証対象の値
 * @returns バリデーション結果（isValid と errorMessage）
 */
const checkEmail = (value: unknown): ValidationResult => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (typeof value !== 'string' || !emailRegex.test(value)) {
    return {
      isValid: false,
      errorMessage: '有効なメールアドレスを入力してください。',
    };
  }
  return { isValid: true, errorMessage: '' };
};

// バリデーション関数のマッピング
const validationRules: Record<
  ValidationType,
  (value: any) => ValidationResult
> = {
  numberValidation: checkNumber,
  stringValidation: checkString,
  emailValidation: checkEmail,
};

/**
 * 指定されたバリデーションタイプに基づいて値を検証する関数
 * @param type - バリデーションタイプ（例: 'numberValidation', 'stringValidation'）
 * @param value - 検証対象の値
 * @returns バリデーション結果（isValid と errorMessage）
 */
export const checkValue = (
  type: ValidationType,
  value: any
): ValidationResult => {
  const validationFn = validationRules[type];
  if (validationFn) {
    return validationFn(value);
  }
  return {
    isValid: false,
    errorMessage: '不明なバリデーションタイプです。',
  };
};

// TODO: 特定の文字列が含まれているかどうかのバリデーションを追加する（sideで利用する想定）
// 例: checkValue('stringValidation', 'test', { includes: 'test' });

/**
 * PartPropertyModel のプロパティを検証する関数
 * @param property - 検証対象の PartPropertyModel オブジェクト（id と partId を除外）
 * @param partId - 検証対象のid
 * @returns 各プロパティのバリデーション結果（name と color）とエラーがあるかどうか
 */
export const checkPartsProperty = (
  property: Omit<PartPropertyModel, 'id' | 'partId'>,
  partId: number
) => {
  const nameValidationResult = checkValue('stringValidation', property.name);
  const colorValidationResult = checkValue('stringValidation', property.color);

  return {
    partId,
    invalidValueInResult:
      !nameValidationResult.isValid || !colorValidationResult.isValid,
    name: nameValidationResult,
    color: colorValidationResult,
  };
};
