import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@libar-dev/architect-core/graph': fileURLToPath(
        new URL('./src/graph/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    testTimeout: 30000,
    include: ['tests/**/*.test.ts', 'tests/steps/**/*.steps.ts'],
    exclude: ['tests/support/**/*.ts'],
    globals: true,
    environment: 'node',
  },
  root: __dirname,
  clearScreen: false,
});
