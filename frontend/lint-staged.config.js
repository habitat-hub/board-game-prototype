/**
 * Lint-staged configuration for frontend
 * - Applies ESLint fix and Prettier to staged files only
 */
export default {
  '**/*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],
  '**/*.{json,md,css,scss}': ['prettier --write'],
};
