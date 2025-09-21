import globals from 'globals';
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

export default [
  eslint.configs.recommended,
  eslintPluginPrettierRecommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 12,
      sourceType: 'module',
      globals: {
        ...globals.commonjs,
        ...globals.es2021,
        ...globals.node,
      },
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    ignores: ['dist/**/*', 'src/__generated__/**/*', 'src/scripts/__generated__/**/*'],
  },
];
