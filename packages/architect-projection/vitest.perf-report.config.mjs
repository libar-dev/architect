import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const configDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    testTimeout: 30000,
    include: ['tests/features/perf/**/*.steps.ts'],
    globals: true,
    environment: 'node',
  },
  root: path.resolve(configDir),
  clearScreen: false,
});
