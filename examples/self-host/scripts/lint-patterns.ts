import { spawnSync } from 'node:child_process';

import { PACKAGE_SELF_HOSTING_SOURCES } from '../../architect-core/src/config/self-hosting.js';

const args = [
  'exec',
  'architect-lint-patterns',
  '--base-dir',
  '.',
  ...PACKAGE_SELF_HOSTING_SOURCES.typescript.flatMap((pattern) => ['-i', pattern]),
  ...process.argv.slice(2),
];

const result = spawnSync('pnpm', args, { stdio: 'inherit' });

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
