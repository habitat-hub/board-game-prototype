import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 0.6,
        functions: 0.6,
        branches: 0.6,
        statements: 0.6,
      },
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
