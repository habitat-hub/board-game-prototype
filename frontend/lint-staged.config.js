/**
 * Lint-staged configuration for frontend
 * - Applies ESLint fix and Prettier to staged files only
 */
export default {
  'src/**/*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],
  'src/**/*.{json,md,css,scss}': ['prettier --write'],
};

