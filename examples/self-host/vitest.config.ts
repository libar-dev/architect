import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: [],
    testTimeout: 30000, // 30 seconds for CLI tests that spawn subprocesses
    include: [
      'tests/steps/api/**/*.steps.ts',
      'tests/steps/cli/**/*.steps.ts',
      'tests/steps/generation/load-preamble.steps.ts',
    ],
    exclude: ['tests/support/**/*.ts', 'tests/fixtures/**/*.ts'],
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['architect.config.ts'],
      exclude: [],
    },
  },
  root: path.resolve(__dirname),
  clearScreen: false,
});
