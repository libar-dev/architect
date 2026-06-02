#!/usr/bin/env node
// @ts-check
/**
 * architect-bin-smoke — the only guard over the @libar-dev/architect umbrella.
 *
 * packages/architect ("@libar-dev/architect") is a bin-only meta-package: its
 * sole load-bearing content is the 7 hand-written shims in
 * `packages/architect/bin/*.js`, each a one-line side-effect import of an owner
 * package's bin entry (`import '@libar-dev/architect-cli/bin/architect'`, etc.).
 * Those imports couple by hardcoded specifier to the owner packages' `exports`
 * maps. Nothing else re-checks that coupling: the umbrella declares no
 * build/typecheck/lint scripts, so the workspace fan-outs (`pnpm -r --filter
 * './packages/**' build|typecheck|lint`) skip it entirely. A rename or drop of
 * a `./bin/<name>` export in architect-cli / architect-mcp would keep every
 * other gate green and surface only at a published consumer's `npx architect`.
 *
 * This smoke runs each of the 7 bins through `node <bin> --help` and fails on
 * any non-zero exit (a broken specifier throws ERR_MODULE_NOT_FOUND). It is the
 * umbrella's `test` script (so `pnpm test` covers it) AND its `prepack` (so it
 * runs immediately before the tarball is built at publish time). It assumes a
 * fresh `dist/` — run `pnpm build` first; `ci:verify` does exactly that.
 *
 * Restores the guard the source repo shipped as `ci:architect:split-smoke`
 * (`architect --help && architect-mcp --help`), extended from 2 bins to all 7.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const binDir = join(repoRoot, 'packages', 'architect', 'bin');

// The umbrella's published bin map (packages/architect/package.json "bin").
const BINS = [
  'architect',
  'architect-generate',
  'architect-guard',
  'architect-lint-patterns',
  'architect-lint-steps',
  'architect-validate',
  'architect-mcp',
];

const PER_BIN_TIMEOUT_MS = 30_000;

/** @type {{ bin: string; ok: boolean; detail: string }[]} */
const results = [];

for (const bin of BINS) {
  const binPath = join(binDir, `${bin}.js`);
  if (!existsSync(binPath)) {
    results.push({ bin, ok: false, detail: `missing shim file: ${binPath}` });
    continue;
  }
  try {
    execFileSync(process.execPath, [binPath, '--help'], {
      stdio: 'pipe',
      timeout: PER_BIN_TIMEOUT_MS,
      encoding: 'utf8',
    });
    results.push({ bin, ok: true, detail: 'exit 0' });
  } catch (/** @type {any} */ err) {
    const stderr = typeof err?.stderr === 'string' ? err.stderr.trim() : '';
    const reason = err?.signal
      ? `killed by ${err.signal} (timeout ${PER_BIN_TIMEOUT_MS}ms?)`
      : `exit ${err?.status ?? '?'}`;
    const head = stderr.split('\n').slice(0, 4).join('\n  ');
    results.push({ bin, ok: false, detail: `${reason}${head ? `\n  ${head}` : ''}` });
  }
}

const failed = results.filter((r) => !r.ok);

for (const r of results) {
  console.log(`${r.ok ? '✓' : '✗'} architect bin: ${r.bin} — ${r.detail}`);
}

if (failed.length > 0) {
  console.error(
    `\n@libar-dev/architect bin smoke FAILED: ${failed.length}/${BINS.length} bin(s) broken.\n` +
      `Each umbrella shim re-imports an owner-package bin export — a failure usually means an\n` +
      `owner's package.json "exports" ./bin/<name> subpath was renamed/dropped, or dist/ is\n` +
      `stale (run \`pnpm build\`). Broken: ${failed.map((f) => f.bin).join(', ')}.`,
  );
  process.exit(1);
}

console.log(
  `\n@libar-dev/architect bin smoke OK — all ${BINS.length} umbrella bins resolve and run.`,
);
