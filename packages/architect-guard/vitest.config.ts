import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30000,
    include: ['tests/**/*.steps.ts'],
    globals: true,
    environment: 'node',
  },
  root: path.resolve(__dirname),
  clearScreen: false,
});
