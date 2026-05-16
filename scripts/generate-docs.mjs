#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARCHITECT_GENERATE_BIN = path.resolve(__dirname, '../node_modules/.bin/architect-generate');

const child = spawnSync(ARCHITECT_GENERATE_BIN, process.argv.slice(2), {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: process.env,
});

if (typeof child.status === 'number') {
  process.exit(child.status);
}

process.exit(1);
