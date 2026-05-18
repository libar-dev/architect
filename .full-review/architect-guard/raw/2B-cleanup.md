## architect-guard — Phase 2B Codebase Cleanup

Reviewer pass focused on configuration hygiene, dependency drift, dead surface, dist contents, and the two scripts unique to guard. Additive to Phase 1. Doctrine: No-BC; deletions over deprecations.

### Executive Summary

The package's **most visible cleanup target is dead barrel surface, not file deletion**. `src/index.ts` exposes ~150 named symbols via 17 wildcards; cross-package grep confirms **only 9 are consumed outside the package** (4 CLI runners + 5 dangling-baseline symbols, all by `architect-cli`). `tier-a-baseline.ts` is 1,138 LOC and 45.8 KB compiled (7.8% of uncompressed tarball, 16% of all JS bytes), and the entire `git/`, `lint/rules.ts` named-rule exports, `lint/steps/` checker exports, `lint/idea-tier/`, `validation/anti-patterns.ts`, `validation/dod-validator.ts`, and `cli/shared.ts` modules are dead surface from a consumer perspective. Configuration drift against the family is moderate (vitest `include` pattern + `node:` import prefix + Zod-strictness on the single open schema are the live issues); dependency hygiene is clean (every shared dep version-aligned). Two scripts are unique to guard — `copy-dangling-baseline.mjs` is a thin 11-line copy that survives because TypeScript's `tsc -b` can't ship JSON, and `packed-dangling-baseline-smoke.mjs` is a meaningful 80-line packed-tarball loader smoke test that is **not wired into `test` or `prepack`** and is family-relevant if generalized. 5 phantom PDR-005 references in `src/` need either documentation creation or deletion sweep.

### Findings by Severity

#### Critical (P0)

| ID          | Title                                                                                                                                              | Locations                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **C2B-G-1** | `tier-a-baseline.ts` ships 45.8 KB of in-repo dogfood paths through the published tarball with **zero external consumers**                         | `src/lint/tier-a-baseline.ts` (1,138 LOC); only callers `src/cli/lint-patterns.ts:45,311,353` |
| **C2B-G-2** | `src/index.ts` 17 wildcard barrels expose ~150 symbols; **9 are consumed externally** — 94% dead surface                                           | `src/index.ts:1-25`                                                                           |
| **C2B-G-3** | `test:pack-smoke` not wired anywhere — the only mechanical guarantee the dangling-baseline machinery survives publishing exists but isn't enforced | `package.json:37` (not in `test`, `prepack`, no CI)                                           |

#### High (P1)

| ID      | Title                                                                                                                                                                                                                                                                                                    | Locations                                                                                                                                                                                                                               |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H2B-G-1 | `AntiPatternThresholdsSchema` is open `z.object` with parallel hand-written `DEFAULT_THRESHOLDS` literal — the package's single Zod boundary breaches its own doctrine                                                                                                                                   | `src/validation/types.ts:81-99`                                                                                                                                                                                                         |
| H2B-G-2 | `node:` prefix inconsistency in src — 6 files use unprefixed `from 'fs'`/`from 'path'`, 5 use `from 'node:fs'`/`from 'node:path'`                                                                                                                                                                        | `src/lint/idea-tier/runner.ts:7`, `src/lint/steps/pair-resolver.ts:6-7`, `src/lint/steps/runner.ts:8`, `src/lint/process-guard/derive-state.ts:30`, `src/lint/process-guard/detect-changes.ts:36`, `src/validation/anti-patterns.ts:33` |
| H2B-G-3 | `process-guard/` symbols re-exported 4× through the barrel chain (`src/index.ts:9,12-17`); the same `validateChanges` reaches consumers via 4 different paths                                                                                                                                            | `src/index.ts:9-17`                                                                                                                                                                                                                     |
| H2B-G-4 | 50% of `dist/` is `.map` files (76 maps for 38 JS files); ~205 KB of source-map bytes in the tarball                                                                                                                                                                                                     | `tsconfig.base.json:13-15` (family-wide, same as core CL-CORE-3)                                                                                                                                                                        |
| H2B-G-5 | 5 phantom PDR-005 references in src; no decision record exists                                                                                                                                                                                                                                           | `src/lint/process-guard/index.ts:14`, `src/lint/process-guard/types.ts:29`, `src/cli/lint-process.ts:170`, `src/lint/process-guard/decider.ts:33,58`                                                                                    |
| H2B-G-6 | `git/` module exports 6 symbols through `src/git/index.ts`, **zero are consumed outside guard** including internally only via 1 caller (`detect-changes.ts`) and self-reference in `branch-diff.ts`; the `@architect-bounded-context:generator` annotation in `git/index.ts:6` is also a doctrine miscue | `src/git/index.ts`, `src/git/branch-diff.ts`, `src/git/helpers.ts`, `src/git/name-status.ts`                                                                                                                                            |
| H2B-G-7 | vitest `include` pattern drift family-wide — guard `tests/**/*.steps.ts` matches cli, but core uses `tests/steps/**`, projection/mcp use `tests/features/**`. No family convention                                                                                                                       | `packages/architect-guard/vitest.config.ts:6`                                                                                                                                                                                           |
| H2B-G-8 | `process-guard-rules.feature` is a doc-feature with no `.steps.ts` file — 76 lines of unrunnable narrative claiming "verified by phase-state-machine feature suite" (phantom suite per Phase 1 H-GUARD-7)                                                                                                | `tests/features/process-guard-rules.feature:43-48`                                                                                                                                                                                      |

#### Medium (P2)

| ID      | Title                                                                                                                                                                                                                                                                                                                            | Locations                                                                |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| M2B-G-1 | `cli/shared.ts` exports `printVersionAndExit`, `handleCliError`, `isDirectCliEntrypoint`; `architect-cli` re-implements the first two locally; **zero cross-package consumers**                                                                                                                                                  | `src/cli/shared.ts:16,24,37`                                             |
| M2B-G-2 | `dangling-baseline.json` empty (`[]`) — the entire dual-write + build-time copy + smoke-test apparatus exists for an empty fixture                                                                                                                                                                                               | `src/lint/dangling-baseline.json`                                        |
| M2B-G-3 | Local `.DS_Store` files in `src/`, `tests/`, package root (gitignored but on disk) — discipline gap                                                                                                                                                                                                                              | `packages/architect-guard/.DS_Store`, `src/.DS_Store`, `tests/.DS_Store` |
| M2B-G-4 | `package.json#exports` declares only `.` + `./package.json`; no curated subpaths. For a package with 6 bounded contexts (`git/`, `cli/`, `lint/`, `lint/process-guard/`, `lint/steps/`, `validation/`) this forces every consumer through the wildcard barrel (compounds C2B-G-2). Compare: projection ships 8 subpath exports   | `packages/architect-guard/package.json:25-31`                            |
| M2B-G-5 | `tier-a-baseline.ts` exports `TIER_A_LINT_BASELINE` constant + `TierABaselineEntry` + `TierABaselineFilterOptions` interfaces + `applyTierABaseline`/`summarizeLintResults` functions; only `applyTierABaseline` and `summarizeLintResults` have callers (in `cli/lint-patterns.ts`). Constant and types are dead export surface | `src/lint/tier-a-baseline.ts:8,15,19`                                    |
| M2B-G-6 | Phantom `phase-state-machine feature suite` reference (`tests/features/process-guard-rules.feature:43-48`); no such suite exists in any package                                                                                                                                                                                  | `tests/features/process-guard-rules.feature:43-48`                       |

#### Low (P3)

| ID      | Title                                                                                                                                                                                                                                                                                                         | Locations         |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| L2B-G-1 | `tsconfig.tsbuildinfo` is 80,553 bytes at package root; ensure `clean` script removes it (it does: `rm -rf dist *.tsbuildinfo`) — but `tsconfig.test.tsbuildinfo` is not generated for guard (test config has `incremental: false`), unlike projection where this is configured. No action; for symmetry only | `tsconfig.json:8` |
| L2B-G-2 | `glob ^10.3.10` is shared with core only (projection/cli/mcp don't depend on glob). 4 import sites in guard                                                                                                                                                                                                   | `package.json:43` |

### Configuration Audit

Compared `architect-guard` against the family base (`tsconfig.architect-base.json`, `tsconfig.base.json`) and each of the 4 sibling publishable packages.

| Concern                                     | guard                                                                           | core                                                | projection                           | cli                   | mcp                            | Diagnosis                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------ | --------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `prepack` in `scripts`                      | yes (`pnpm clean && pnpm build`)                                                | **no** (JSON-root, broken — CL-CORE-1)              | yes                                  | yes                   | yes                            | guard correct                                                                                   |
| `typecheck` covers both configs             | **yes** (`tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.test.json`) | no (only `tsconfig.test.json`)                      | no (only `tsconfig.test.json`)       | yes                   | no                             | guard ahead of core/projection/mcp; same as cli                                                 |
| `lint` covers `tests/`                      | yes (`eslint src tests`)                                                        | no (`eslint src` — CL-CORE-10)                      | yes                                  | yes                   | yes                            | guard correct                                                                                   |
| `eslint` in devDeps                         | yes                                                                             | **no** (relies on root hoist)                       | yes                                  | yes                   | yes                            | guard correct                                                                                   |
| `prepack` runs `pnpm clean` first           | yes                                                                             | no                                                  | yes                                  | yes                   | yes                            | guard correct                                                                                   |
| ESLint extension (`no-restricted-syntax`)   | none                                                                            | none                                                | yes (`isPlainObject` ban)            | none                  | none                           | projection-only; consider adding `as ProcessStatusValue` ban here per Phase 1 C-GUARD-1 fallout |
| vitest `include` pattern                    | `tests/**/*.steps.ts`                                                           | `tests/steps/**`                                    | `tests/features/**/*.steps.ts`       | `tests/**/*.steps.ts` | `tests/features/**/*.steps.ts` | **drift family-wide** — guard matches cli but not core/projection/mcp                           |
| vitest `exclude` clause                     | **absent**                                                                      | present                                             | present                              | absent                | present                        | guard + cli are outliers                                                                        |
| `path` import in vitest config              | `from 'path'` (legacy)                                                          | `__dirname` (no import)                             | `from 'path'` (legacy)               | `from 'node:path'`    | `from 'path'` (legacy)         | family-wide drift; guard among the legacy users                                                 |
| `tsconfig.json` has `references`            | yes (1: core)                                                                   | no                                                  | yes (1: core)                        | yes (3)               | yes (2)                        | core is the leaf                                                                                |
| `tsconfig.json` extra options               | none                                                                            | none                                                | `types: ["node"]`, `tsBuildInfoFile` | `baseUrl: "."`        | none                           | guard is canonical                                                                              |
| `tsconfig.test.json` `rootDir`              | `"."`                                                                           | `"."`                                               | `"."`                                | `"."`                 | `".."`                         | mcp is the outlier                                                                              |
| `tsconfig.test.json` `composite: false` set | yes                                                                             | yes                                                 | **missing**                          | yes                   | yes                            | projection is the outlier                                                                       |
| Subpath exports in `package.json#exports`   | 0 (only `.` + `./package.json`)                                                 | 2 (`./config`, `./roles` — `./roles` is **broken**) | 8                                    | 7 (bin paths)         | 1 (bin path)                   | guard has fewest curated subpaths despite 6 bounded contexts                                    |

**Net diagnosis:** guard's tsconfig posture is **clean and canonical** (Phase 1 confirmed: `typecheck` covers both configs, which core and projection don't). The two real drifts are vitest `include`/`exclude` (family-wide and best fixed in one normalization PR with core/projection/mcp/cli) and `node:` prefix consistency (already family-wide per core F4A-L-1).

### Dependency Audit

```
guard deps:    @libar-dev/architect-core (workspace:*), glob ^10.3.10, zod ^4.1.11
guard devDeps: @amiceli/vitest-cucumber ^6.3.0, @types/node ^24.12.0, eslint ^9.17.0, typescript ^5.8.2, vitest ^4.1.4
```

| Dependency                                  | guard      | core       | projection | cli        | mcp        | Drift?                                           |
| ------------------------------------------- | ---------- | ---------- | ---------- | ---------- | ---------- | ------------------------------------------------ |
| `zod`                                       | `^4.1.11`  | `^4.1.11`  | `^4.1.11`  | `^4.1.11`  | `^4.1.11`  | aligned                                          |
| `@amiceli/vitest-cucumber`                  | `^6.3.0`   | `^6.3.0`   | `^6.3.0`   | `^6.3.0`   | `^6.3.0`   | aligned                                          |
| `@types/node`                               | `^24.12.0` | `^24.12.0` | `^24.12.0` | `^24.12.0` | `^24.12.0` | aligned                                          |
| `eslint`                                    | `^9.17.0`  | **absent** | `^9.17.0`  | `^9.17.0`  | `^9.17.0`  | core is outlier                                  |
| `typescript`                                | `^5.8.2`   | `^5.8.2`   | `^5.8.2`   | `^5.8.2`   | `^5.8.2`   | aligned                                          |
| `vitest`                                    | `^4.1.4`   | `^4.1.4`   | `^4.1.4`   | `^4.1.4`   | `^4.1.4`   | aligned                                          |
| `glob`                                      | `^10.3.10` | `^10.3.10` | —          | —          | —          | only core+guard depend on glob; versions aligned |
| `@libar-dev/architect-core` (workspace dep) | yes        | —          | yes        | yes        | yes        | correct direction                                |

Notes:

- Zero version drift on shared deps. Excellent discipline. (Family-wide observation — core's CL-CORE-10 "shared deps pinned identically" is confirmed for guard.)
- `glob` is genuinely required (4 import sites: `idea-tier/runner.ts`, `steps/runner.ts`, `process-guard/detect-changes.ts`, `process-guard/session-state-reader.ts`).
- Guard has **no** unique-to-guard deps beyond glob (core also has glob).

### Dead-Surface Analysis: `src/index.ts` 17 Wildcards

Cross-package grep of every symbol exposed through `src/index.ts`:

```
src/index.ts:
  export * from './git/index.js';                              [6 symbols — ALL DEAD externally]
  export * from './cli/shared.js';                             [3 functions — ALL DEAD externally]
  export { run*Cli } from './cli/index.js';                    [4 functions — ALL 4 LIVE (architect-cli)]
  export * from './lint/index.js';                             [composite — see below]
  export * from './lint/engine.js';                            [9 symbols — ALL DEAD externally]
  export * from './lint/rules.js';                             [13 symbols — ALL DEAD externally]
  export * from './lint/process-guard/index.js';               [~25 symbols — ALL DEAD externally]
  export * from './lint/process-guard/derive-state.js';        [duplicate of above]
  export * from './lint/process-guard/detect-changes.js';      [duplicate of above]
  export * from './lint/process-guard/decider.js';             [duplicate of above]
  export * from './lint/process-guard/session-state-reader.js';[duplicate of above]
  export type * from './lint/process-guard/types.js';          [19 types — ALL DEAD externally]
  export * from './lint/steps/index.js';                       [16 symbols — ALL DEAD externally]
  export * from './lint/steps/types.js';                       [3 symbols — ALL DEAD externally]
  export * from './lint/idea-tier/index.js';                   [~12 symbols — ALL DEAD externally]
  export * from './validation/index.js';                       [composite — see below]
  export * from './validation/types.js';                       [9 symbols — ALL DEAD externally]
  export * from './validation/dod-validator.js';               [7 symbols — ALL DEAD externally]
  export * from './validation/anti-patterns.js';               [9 symbols — ALL DEAD externally]
```

**Live externally (consumed by `architect-cli`):**

- `runValidatePatternsCli` (cli/lint-patterns.ts bin entry)
- `runLintStepsCli`
- `runLintPatternsCli`
- `runLintProcessCli`
- `compareDanglingBaseline`, `writeDanglingBaseline` (via `cli/commands/_shared/structured.ts:5-11`)
- `DANGLING_BASELINE_SOURCE_PATH`
- type `DanglingBaselineComparison`
- type `DanglingBaselineEntry`

**Recipe (No-BC, post-2.0):**

1. Replace 17 wildcards with **8 explicit named exports** matching the 9 consumers (the 4 `run*Cli` are already named-export). The barrel becomes:
   ```ts
   export {
     runLintPatternsCli,
     runLintProcessCli,
     runLintStepsCli,
     runValidatePatternsCli,
   } from './cli/index.js';
   export {
     DANGLING_BASELINE_SOURCE_PATH,
     compareDanglingBaseline,
     writeDanglingBaseline,
   } from './lint/dangling-baseline.js';
   export type {
     DanglingBaselineComparison,
     DanglingBaselineEntry,
   } from './lint/dangling-baseline.js';
   ```
2. Delete `cli/shared.ts` re-exports (architect-cli has its own implementations of `printVersionAndExit` and `handleCliError`).
3. Delete `git/index.ts` from the barrel — keep the module internal-only. (Re-home decision in H-GUARD-3 separately.)
4. Delete `lint/engine.ts`, `lint/rules.ts`, `lint/idea-tier/`, `lint/steps/` exports from the top-level barrel; they remain importable internally for the CLIs.
5. Delete `validation/anti-patterns.ts`, `validation/dod-validator.ts`, `validation/types.ts` re-exports — these are CLI-internal helpers.
6. The `lint/process-guard/` quadruple re-export collapses to zero — no consumer accesses these types/functions across packages.

**Tarball reduction estimate:**

- `.d.ts` byte payload (93 KB total) drops to ~10-15 KB (only the 8 surface symbols + their dependencies need declarations leaked).
- The actual `.js` runtime stays identical (tree-shaking only helps consumers; the published package still needs all the source files because the CLIs reference everything internally).
- Net tarball reduction: ~70-80 KB uncompressed (~12% of current 583 KB).

### The Dangling-Baseline Machinery Review

**Files involved:**

- `src/lint/dangling-baseline.ts` (139 LOC) — schema + read/write/compare logic
- `src/lint/dangling-baseline.json` (1 line: `[]`) — empty fixture
- `scripts/copy-dangling-baseline.mjs` (11 LOC) — build-time JSON copy
- `scripts/packed-dangling-baseline-smoke.mjs` (80 LOC) — packed-tarball loader smoke test
- `package.json:33` `"build": "tsc -b && node scripts/copy-dangling-baseline.mjs"`
- `package.json:37` `"test:pack-smoke": "node scripts/packed-dangling-baseline-smoke.mjs"`

**What `copy-dangling-baseline.mjs` does:** Copies `src/lint/dangling-baseline.json` → `dist/lint/dangling-baseline.json` after `tsc -b`. Necessary because TypeScript doesn't bundle non-`.ts` files. 11 lines, no dependencies beyond node built-ins. **Robust** in dev; trivially correct. **Worth promoting family-wide?** Only if another package needs JSON fixtures in dist — none currently does. Keep as-is.

**What `packed-dangling-baseline-smoke.mjs` does:**

1. Runs `pnpm pack` against the package root → produces tarball in temp dir.
2. Untars the tarball, validates `dist/lint/dangling-baseline.json` exists and is readable.
3. Symlinks `zod` from monorepo into the extracted package's `node_modules/`.
4. Imports the packed `dist/lint/dangling-baseline.js` via `import()` and calls `readDanglingBaseline()`.
5. Asserts the result is an array.
6. **Deletes** the packed baseline JSON and re-imports — asserts the error message contains `"Dangling baseline file not found"` (negative test for graceful failure).
7. Logs results; cleans up temp unless `ARCHITECT_KEEP_PACK_SMOKE_TEMP=1`.

**Quality assessment:** Genuinely good. It exercises the **full publish-to-consume contract** — not just compilation. Specifically:

- Catches `package.json#files` regressions (if `dist` ever drops from `files`, this fails).
- Catches `tsc -b` regression (if `dist/lint/dangling-baseline.js` not emitted, fails).
- Catches `copy-dangling-baseline.mjs` regression (if JSON not copied, fails).
- Catches `package.json#exports` regression (if `./package.json` removed, `require.resolve` could break — not directly tested but adjacent).
- Catches graceful-degradation regression (the missing-file path is exercised).

This is the **only mechanical post-pack assertion in the family**. Compare projection's audit scripts (`options-schema-barrel-audit.mjs`, `jsdoc-boilerplate-audit.mjs`) which check **source-level** invariants but never validate that publishing works.

**Worth promoting family-wide?** Yes — extract to a workspace-level `scripts/pack-smoke.mjs` parameterized by package name + asserted entry-points + asserted resources. Run for every publishable package in CI before `changeset publish`. Closes a class of bug (Phase 1's C-CORE-1 broken `./roles` export would have been caught by such a smoke test pre-publish).

**Wiring gap (C2B-G-3):** `test:pack-smoke` is defined but **invoked nowhere** — not in `test`, not in `prepack`, not in any workflow (there is no CI workflow per family-wide CI-1). It runs only if a human types `pnpm test:pack-smoke`. Add it to `prepack` (cost: ~3-5s on a single-package pack); or better, add it to a CI workflow gated on `package.json` or `dist/`-affecting changes.

**Consumer-side absence robustness (H-GUARD-13):** Currently `readDanglingBaseline()` throws `Error: Dangling baseline file not found at ${path}. Run architect-validate --base-dir . --update-baseline to create it.` This works but couples the throw site to the CLI command name. The error message is also slightly wrong: the **packed** baseline can never be regenerated by a consumer via `architect-validate --update-baseline` — that command writes to the consumer's local baseline, not the package's dist. Recipe: return a `Result<readonly DanglingBaselineEntry[], BoundaryParseError>` and let the CLI compose the user-facing message. Then the call site at `src/lint/dangling-baseline.ts:84-104` aligns with the family's `Result<T,E>` discipline.

**`JSON.parse` without `parseAtBoundary` (C-GUARD-4 echo at `dangling-baseline.ts:102`):** `JSON.parse(content) as unknown` followed by `DanglingBaselineSchema.parse(parsed)` is structurally `parseAtBoundary`-shaped but doesn't use the helper. Three-line refactor to use `parseAtBoundary(DanglingBaselineSchema, JSON.parse(content))` and return `Result`. Closes the trust-boundary gap Phase 1 named.

### Files That Should Not Be in `dist/`

From the packed tarball (`pnpm pack` output, 583 KB uncompressed, 123 KB compressed, 155 entries):

| Category                                        | Files | Bytes (uncompressed) | Pct of tarball |
| ----------------------------------------------- | ----- | -------------------- | -------------- |
| `.js`                                           | 38    | 282,375              | 48%            |
| `.map` (sourceMap + declarationMap)             | 76    | 204,838              | 35%            |
| `.d.ts`                                         | 38    | 93,159               | 16%            |
| `.json` (package.json + dangling-baseline.json) | 2     | 1,662                | <1%            |
| README/LICENSE                                  | 1     | ~1,000               | <1%            |

**Files that shouldn't be there:**

1. **All 76 `.map` files (~205 KB, 35% of tarball).** Family-wide finding (core CL-CORE-3): `tsconfig.base.json:13-15` enables both `sourceMap: true` and `declarationMap: true`. Disabling both in the shared base config halves the tarball across all 5 publishable packages. No production consumer needs source maps for a published library; if debug builds are wanted, ship a separate `dist-debug/`.

2. **`dist/lint/tier-a-baseline.js` (45.8 KB) + `dist/lint/tier-a-baseline.js.map` (19.5 KB) + `dist/lint/tier-a-baseline.d.ts.map` (784 B).** Together 7.8% of uncompressed tarball, 16% of all JS bytes. This is the hardcoded in-repo dogfood baseline. Phase 1 C-GUARD-2 named the deletion — once `tier-a-baseline.ts` becomes the ~30-LOC JSON-loader shape `dangling-baseline.ts` already uses, the `dist/lint/tier-a-baseline.js` drops from 45.8 KB to ~3 KB and the **data** moves to `architect/tier-a-baseline.json` at the dogfood-repo root (not shipped at all).

3. **`dist/lint/tier-a-baseline.d.ts` (787 B)** stays trivially small after the refactor.

4. **Question worth asking:** does `dist/cli/shared.js` need to be in the published tarball? `printVersionAndExit`/`handleCliError`/`isDirectCliEntrypoint` are only used by guard's own CLIs (`cli/lint-patterns.ts`, `cli/lint-process.ts`, etc.), which are themselves only invoked from `architect-cli`'s bin shims. The CLIs are entry points, not exported APIs. After the barrel curation (C2B-G-2 recipe), `cli/shared.js` is still needed at runtime when guard's CLI functions are called, so **keep it**. But its `printVersionAndExit` re-implementation (it reads `package.json` via `import.meta.url` and walks 3 levels up) is brittle to dist-directory restructuring; cli/version.ts in architect-cli does the same thing for that package — a workspace-level utility that takes a `packageRoot` could collapse both into one place.

5. **`tsconfig.tsbuildinfo`** at package root (80 KB) — correctly excluded from `files` (only `dist` is shipped), but it's a sanity check that this file never lands inside `dist/`. Verified: not in tarball.

**Net recipe:**

- Disable `sourceMap` + `declarationMap` family-wide (one-line PR against `tsconfig.base.json`) → drops guard tarball from 583 KB → ~378 KB.
- Refactor `tier-a-baseline.ts` to match `dangling-baseline.ts` shape → drops guard tarball from ~378 KB → ~314 KB.
- Combined: ~46% tarball reduction, no behavioral change.

### Cross-cutting Notes

- **Phantom PDR-005 sweep (H2B-G-5):** Two paths. (a) Delete all 5 source references and let the test-suite + decider code be the spec (consistent with Phase 1's "Architect State is Code" doctrine since the FSM **is** in code at `architect-core/src/validation/fsm/`). (b) Create `architect/decisions/pdr-005-process-guard-fsm.feature` per the convention shown by `pdr-001-session-workflow-commands.feature`. (b) is the higher-leverage move because the FSM is a real decision worth recording and the references are load-bearing in error messages (`cli/lint-process.ts:170` is in CLI help output).

- **`git/` re-homing (H2B-G-6):** Phase 1 H-GUARD-3 said `git/` should move to core because "actually consumed by core". Grep confirms **core does not consume it**. The only consumer is guard's own `process-guard/detect-changes.ts`. Either:
  1. Demote `git/` to `src/lint/process-guard/_git/` (a sub-module of process-guard, not a top-level concern), drop the `@architect-bounded-context:generator` annotation, drop the barrel export.
  2. If a future `@libar-dev/architect-git` package is genuinely planned (Phase 1 master-report implication #8), keep it top-level and untouched. Lower priority than other cleanup work.
  3. The `@architect-bounded-context:generator` annotation in `src/git/index.ts:6` is wrong regardless — guard is not a generator package. Fix the annotation independently.

- **The 4× re-export of `process-guard/*` symbols** through `src/index.ts:9,12-17` (`./lint/index.js` already re-exports `./lint/process-guard/index.js` which already re-exports `./lint/process-guard/decider.js` etc.) is purely additive noise — every barrel export already cascades. Drop lines 12-17 entirely; the `./lint/index.js` wildcard at line 9 covers them. Better still: do the C2B-G-2 sweep and none of these wildcards exist.

- **`AntiPatternThresholdsSchema` doctrine breach (H2B-G-1):** Three-line fix:
  ```ts
  // Before
  export const AntiPatternThresholdsSchema = z.object({ ... });
  export const DEFAULT_THRESHOLDS: AntiPatternThresholds = { scenarioBloatThreshold: 30, ... };
  // After
  export const AntiPatternThresholdsSchema = z.strictObject({ ... });
  export const DEFAULT_THRESHOLDS = AntiPatternThresholdsSchema.parse({});
  ```
  Single Zod boundary in the package; gets aligned with Phase 1 C-GUARD-3 in one move.

### What's Healthy (Preserve)

- `prepack` correctly placed in `scripts` (not at JSON root like core).
- `typecheck` covers both `tsconfig.json` and `tsconfig.test.json` (ahead of core, projection, mcp).
- `lint` covers `src tests` (aligned with siblings except core).
- `clean` script removes both `dist` and `*.tsbuildinfo` (matches family).
- `eslint` in devDeps (core is the outlier).
- Every shared dep pinned identically across the family.
- Zero `@ts-ignore`/`@ts-expect-error`/`eslint-disable`/`TODO`/`FIXME` in `src/` (confirmed via grep — Phase 1 finding).
- The `packed-dangling-baseline-smoke.mjs` script is the only mechanical publish-contract test in the family — promote, don't delete.
- `dangling-baseline.ts` is structurally correct (Zod schema + readonly + sort-stable comparator); only the `parseAtBoundary` gap separates it from projection-reference quality.
