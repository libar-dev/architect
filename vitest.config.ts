import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: ['tests/support/step-lint-setup.ts'],
    testTimeout: 30000, // 30 seconds for CLI tests that spawn subprocesses
    include: [
      // Legacy tests (to be migrated)
      '__tests__/**/*.test.ts',
      // New BDD step definitions
      'tests/steps/**/*.steps.ts',
      // Unit tests (kept as Vitest)
      'tests/unit/**/*.test.ts',
    ],
    exclude: [
      // QuickPickle files (separate config via vitest.quickpickle.config.ts)
      'tests/steps/quickpickle/**/*.ts',
      // Common step definitions (utility file, not a test)
      'tests/steps/common.steps.ts',
      // Support files (not tests)
      'tests/support/**/*.ts',
      // Fixtures (not tests)
      'tests/fixtures/**/*.ts',
    ],
    globals: true,
    environment: 'node',
  },
  css: false,
  root: path.resolve(__dirname),
  clearScreen: false,
  plugins: [],
});
