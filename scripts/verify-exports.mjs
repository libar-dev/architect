#!/usr/bin/env node

/**
 * Verify that all declared package.json exports resolve to existing files in dist/.
 *
 * Runs as part of prepublishOnly to prevent publishing packages with missing
 * entry points — the exact issue that caused incomplete dist/ in pre.5.
 *
 * Exit code 0: all exports verified.
 * Exit code 1: one or more exports missing.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const pkg = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf8'));
const exports = pkg.exports;

if (!exports || typeof exports !== 'object') {
  console.error('No exports field found in package.json');
  process.exit(1);
}

/**
 * Verify that a resolved path stays inside the project root.
 * Prevents crafted export values (absolute paths, ../ traversal) from
 * probing arbitrary filesystem locations.
 */
function assertInsideRoot(absolutePath, label) {
  if (!absolutePath.startsWith(rootDir + '/') && absolutePath !== rootDir) {
    console.error(`  SECURITY  ${label} resolves outside project root: ${absolutePath}`);
    process.exit(1);
  }
}

let missing = 0;
let verified = 0;

for (const [entryPoint, mapping] of Object.entries(exports)) {
  // Skip non-object entries (e.g., "./package.json": "./package.json")
  if (typeof mapping === 'string') {
    const absolutePath = resolve(rootDir, mapping);
    assertInsideRoot(absolutePath, entryPoint);
    if (!existsSync(absolutePath)) {
      console.error(`  MISSING  ${entryPoint} → ${mapping}`);
      missing++;
    } else {
      verified++;
    }
    continue;
  }

  // Check both types and import paths
  for (const [condition, filePath] of Object.entries(mapping)) {
    if (typeof filePath !== 'string') {
      console.warn(`  SKIPPED  ${entryPoint} [${condition}] — nested conditional mapping (not verified)`);
      continue;
    }
    const absolutePath = resolve(rootDir, filePath);
    assertInsideRoot(absolutePath, `${entryPoint} [${condition}]`);
    if (!existsSync(absolutePath)) {
      console.error(`  MISSING  ${entryPoint} [${condition}] → ${filePath}`);
      missing++;
    } else {
      verified++;
    }
  }
}

// Also verify bin entries (supports both string and object forms)
if (pkg.bin) {
  const binEntries =
    typeof pkg.bin === 'string'
      ? [[pkg.name?.split('/').pop() ?? '(default)', pkg.bin]]
      : Object.entries(pkg.bin);

  for (const [cmd, filePath] of binEntries) {
    const absolutePath = resolve(rootDir, filePath);
    assertInsideRoot(absolutePath, `bin.${cmd}`);
    if (!existsSync(absolutePath)) {
      console.error(`  MISSING  bin.${cmd} → ${filePath}`);
      missing++;
    } else {
      verified++;
    }
  }
}

if (missing > 0) {
  console.error(`\nExport verification failed: ${missing} missing, ${verified} verified.`);
  console.error('Run "pnpm clean && pnpm build" to fix.');
  process.exit(1);
}

console.log(`Exports verified: ${verified} paths exist.`);
