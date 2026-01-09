import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'out/**',
        'dist/**',
        'build/**',
        'coverage/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        'test/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@renderer': path.resolve(__dirname, './src/renderer/src'),
      '@common': path.resolve(__dirname, './src/common'),
      '@main': path.resolve(__dirname, './src/main'),
      '@db': path.resolve(__dirname, './src/main/db'),
      '@preload': path.resolve(__dirname, './src/preload'),
      '@types': path.resolve(__dirname, './src/types')
    }
  }
});
