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
const checkNumber = (value: any): ValidationResult => {
  if (typeof value !== 'number') {
    return { isValid: false, errorMessage: '数値を入力してください。' };
  }
  if (value < 0) {
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
