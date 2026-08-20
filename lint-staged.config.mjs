// Root lint-staged config — drives the pre-commit hook (`.husky/pre-commit` →
// `pnpm ci:pre-commit` → `lint-staged`).
//
// Two repo-specific constraints shape this config:
//
// 1. ESLint must be ROOT-SCOPED. The root `eslint.config.mjs` only wires
//    type-aware `parserOptions.project` for the root surfaces (architect.config.ts,
//    tests/**, scripts/**). Running root ESLint on a `packages/*/src/**` file
//    CRASHES with "rule which requires type information, but don't have
//    parserOptions set" — package source is linted by each package's OWN flat
//    config via `pnpm lint` (which runs at pre-push). So we only `eslint --fix`
//    the root-owned `.ts` surface here; everything else gets prettier only.
//
// 2. Architect state folders (architect/stubs, architect/step-stubs) hold design
//    artifacts intentionally outside the TS project — parsed as Architect state,
//    not compiled or linted. Filter them out of the ESLint set so a staged stub
//    edit does not fail the hook with "file not in project".
//
// One function-based key (not separate eslint/prettier keys) so ESLint --fix and
// Prettier --write run SEQUENTIALLY on the same file — separate keys run
// concurrently in lint-staged and would race on the same write.

import { relative } from 'node:path';

const ARCHITECT_STATE_PATH = /\/architect\/(stubs|step-stubs)\//u;

// A staged path (lint-staged passes absolute paths) is in the root ESLint surface
// when, relative to the repo root, it is the top-level architect.config.ts or a
// .ts under tests/ or scripts/ — and not an Architect-state stub.
const isRootScopedEslintTarget = (absFile) => {
  const rel = relative(process.cwd(), absFile);
  if (ARCHITECT_STATE_PATH.test(absFile)) return false;
  if (!rel.endsWith('.ts')) return false;
  return rel === 'architect.config.ts' || rel.startsWith('scripts/') || rel.startsWith('tests/');
};

export default {
  // Glob mirrors the canonical `format` / `format:check` scripts in package.json
  // (`**/*.{ts,tsx,json,md,yml,yaml}`) so the staged-file gate and the full-repo
  // gate format the same extension set. `.mjs`/`.mts`/`.cts` are intentionally
  // out of both — this is a `.ts`-ESM repo with no such files, and root ESLint is
  // not type-aware for them (broadening would crash the hook, see constraint 1).
  '**/*.{ts,tsx,json,md,yml,yaml}': (files) => {
    const commands = [];
    const eslintTargets = files.filter(isRootScopedEslintTarget);
    if (eslintTargets.length > 0) {
      commands.push(`eslint --fix ${eslintTargets.join(' ')}`);
    }
    commands.push(`prettier --write ${files.join(' ')}`);
    return commands;
  },
};
