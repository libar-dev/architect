#!/usr/bin/env node
// @ts-check
/**
 * check-build-fresh — staleness gate for the workspace `dist/` outputs.
 *
 * The dogfood graph scripts (`architect:q` / `architect:graph`) run
 * under `tsx --conditions=source` and resolve the workspace packages from `src/`,
 * so they are always live. But the *built bins* still execute from `dist/`:
 *
 *   - `architect-generate` (behind `docs:all` and every `docs:*`)
 *   - `architect-guard`     (behind `architect:guard` / `:guard:all`)
 *   - `architect-validate`  (behind `validate:all` / `validate:patterns`)
 *
 * If `src/` has moved ahead of `dist/`, those bins run OLD compiled code and
 * answer confidently with stale shapes — a silent-wrong-answer, the most
 * dangerous failure mode. The determinism gate (`pnpm docs:all && git diff
 * --exit-code docs-live`) is only trustworthy once `dist/` matches `src/`.
 *
 * This gate converts that silent-wrong-answer into a loud stop. For each
 * package it compares the newest `src/**\/*.ts` mtime against the newest
 * `dist/**\/*.js` mtime; if source is ahead (or `dist/` is missing) it exits
 * non-zero and tells you to run `pnpm build`.
 *
 * Mtime-based, so a `git checkout` that rewrites source mtimes can report a
 * false "stale" — but the remedy (`pnpm build`) is an incremental `tsc -b`
 * no-op in that case, so a false positive costs ~a second; a false negative in
 * the edit-then-run loop is effectively impossible.
 *
 * CI is immune by construction (a clean checkout always builds before these
 * run); this gate earns its keep locally, mid-refactor.
 *
 * Run via `pnpm check:build`. Exits non-zero with a per-package message on failure.
 */
import { readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packagesDir = join(repoRoot, 'packages');

/**
 * Newest mtime (ms) of any file under `dir` whose name ends in one of `exts`.
 * Returns 0 when `dir` is absent or contains no matching files.
 * @param {string} dir
 * @param {string[]} exts
 * @returns {number}
 */
function newestMtime(dir, exts) {
  if (!existsSync(dir)) return 0;
  let newest = 0;
  /** @param {string} d */
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue;
      const p = join(d, entry.name);
      if (entry.isDirectory()) {
        walk(p);
      } else if (exts.some((ext) => entry.name.endsWith(ext))) {
        const m = statSync(p).mtimeMs;
        if (m > newest) newest = m;
      }
    }
  };
  walk(dir);
  return newest;
}

const packages = readdirSync(packagesDir, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .filter((name) => existsSync(join(packagesDir, name, 'src')));

/** @type {string[]} */
const stale = [];

for (const pkg of packages) {
  const base = join(packagesDir, pkg);
  const distDir = join(base, 'dist');
  if (!existsSync(distDir)) {
    stale.push(`${pkg}: dist/ is missing — never built`);
    continue;
  }
  const srcNewest = newestMtime(join(base, 'src'), ['.ts']);
  const distNewest = newestMtime(distDir, ['.js']);
  if (srcNewest > distNewest) {
    const lagSec = Math.round((srcNewest - distNewest) / 1000);
    stale.push(`${pkg}: src/ is ${lagSec}s ahead of dist/`);
  }
}

if (stale.length > 0) {
  console.error('\n✖ Stale build — dist/ is behind src/ in:\n');
  for (const line of stale) console.error(`    ${line}`);
  console.error(
    '\nThe built bins (architect-generate, architect-guard, architect-validate)\n' +
      'run from dist/, so they would project from OLD code and answer wrong.\n' +
      '\n    Run:  pnpm build\n',
  );
  process.exit(1);
}

console.log(`✓ dist/ is fresh for all ${packages.length} packages`);
