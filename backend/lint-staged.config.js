/**
 * Lint-staged configuration for backend
 * - Applies ESLint fix and Prettier to staged files only
 *
 * Use CommonJS exports to avoid Node warning about ESM in .js files
 * when package.json does not declare "type": "module".
 */
module.exports = {
  '**/*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],
  '**/*.{json,md,css,scss}': ['prettier --write'],
};
