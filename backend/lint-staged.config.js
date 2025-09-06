/**
 * Lint-staged configuration for backend
 * - Applies ESLint fix and Prettier to staged files only
 */
export default {
  'src/**/*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],
  'src/**/*.{json,md}': ['prettier --write'],
  'vitest.config.ts': ['eslint --fix', 'prettier --write'],
};

