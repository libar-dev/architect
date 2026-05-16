import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30000,
    include: ['tests/steps/**/*.steps.ts'],
    exclude: ['tests/support/**/*.ts'],
    globals: true,
    environment: 'node',
  },
  root: __dirname,
  clearScreen: false,
});
