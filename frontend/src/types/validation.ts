interface ValidationResult {
  isValid: boolean;
  errorMessage: string;
}

interface PartPropertyValidation {
  partId: number;
  invalidValueInResult: boolean;
  name: ValidationResult;
  color: ValidationResult;
}

export type ValidationType = PartPropertyValidation;
