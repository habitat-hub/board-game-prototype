import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'lcov', 'html'],
      exclude: [
        'dist/**',
        'node_modules/**',
        'src/scripts/**',
        'src/**/types.ts',
      ],
    },
  },
});
