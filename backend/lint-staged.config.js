/**
 * Lint-staged configuration for backend
 * - Applies ESLint fix and Prettier to staged files only
 *
 * Use CommonJS exports to avoid Node warning about ESM in .js files
 * when package.json does not declare "type": "module".
 */
module.exports = {
  'src/**/*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],
  'src/**/*.{json,md}': ['prettier --write'],
  'vitest.config.ts': ['eslint --fix', 'prettier --write'],
};
