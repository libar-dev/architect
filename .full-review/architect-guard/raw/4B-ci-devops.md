# architect-guard — Phase 4B: CI/DevOps & Operational Review

**Package:** `@libar-dev/architect-guard@2.0.0-pre.1`  
**Scope:** Publish pipeline, local CI wire-up, family-wide script drift, operational risks for long-running consumers.

## Executive Summary

Guard's CI/DevOps posture is **sound locally but operationally incomplete** at the family level. Four critical findings:

1. **`packed-dangling-baseline-smoke.mjs` is the family's only post-pack publish-contract test — fully implemented but unwired** (`test:pack-smoke` script exists; never runs). Phase 3 flagged this as TC-H-GUARD-7; wiring it to `prepack` is a one-line fix (identical pattern to projection's perf-gate wire-up, Cleanup-C-PROJ-1). Would have caught core's broken `./roles` export pre-publish.

2. **Family-wide CI absence** (core CI-1/CI-2) amplifies guard's operational risks. Guard is consumed at runtime by `architect-cli` (Phase 1 H-GUARD-2 confirmed) and dogfooded via `pnpm architect:guard --staged` in pre-commit context. No CI means:
   - Tarball-composition regressions (missing resources, stale exports) ship undetected.
   - Dependency drift unmonitored (guard depends on core; core's breaking changes aren't caught until end-user report).
   - Multi-version testing absent (guard pins `engines: >=20.0.0`; no matrix test of Node 20 vs 22).

3. **`publishConfig.provenance: true` is declared but unimplemented** — no workflow to issue SLSA attestations. Family blocker identical to core CI-2.

4. **Tarball size inflation from `tier-a-baseline.ts`** (Phase 2 Cleanup-C-GUARD-2): 45.8 KB / 7.8% of the tarball, only consumed internally. Combined with sourcemaps (50% of files), post-Phase-2-cleanup tarball shrinks ~46%.

The local scripts are disciplined (`typecheck` covers both configs, `prepack` in scripts, lint + test chain correct). The operational risk concentrates at the family level: no CI enforces consistency, no smoke-test gates publication, no dependency-update automation.

## The `prepack` wire-up recipe (TC-H-GUARD-7 operationalization)

**Current state:**

```json
{
  "scripts": {
    "build": "tsc -b && node scripts/copy-dangling-baseline.mjs",
    "test": "pnpm typecheck && vitest run --config vitest.config.ts",
    "test:pack-smoke": "node scripts/packed-dangling-baseline-smoke.mjs",
    "prepack": "pnpm clean && pnpm build"
  }
}
```

The smoke script **exists and is fully implemented** (Phase 3 verified: untars the package, symlinks zod, dynamic-imports the dist module, exercises the baseline-load path, validates the missing-resource negative case). It is **never executed** because `test:pack-smoke` is a manual target, not wired to CI or `prepack`.

**Recipe — one-line fix:**

```json
{
  "scripts": {
    "prepack": "pnpm clean && pnpm build && node scripts/packed-dangling-baseline-smoke.mjs"
  }
}
```

**Why this matters:**

- Before every `pnpm publish`, npm/pnpm runs `prepack`. This ensures the smoke test runs locally and catches regressions in tarball composition.
- It's the **local-CI equivalent of projection's perf-gate wire-up** (Cleanup-C-PROJ-1). Both are one-line package.json fixes that gate publication.
- **Would have caught core's broken `./roles` export** (C-CORE-1) — the smoke script imports the dist module, and an export cycle or missing resource throws immediately.
- It does **NOT require CI infrastructure** — runs before `npm publish`, on the developer's machine, during pre-release validation.

**Dependency:** requires the smoke script itself to be robust (already verified by Phase 3). No additional work.

**Sequencing:** Land immediately, independent of Phase 2 cleanup. High-leverage, zero risk.

## The workspace-level `pack-smoke.mjs` promotion plan

Phase 2 Cleanup-H-GUARD-4 flagged promotion as a family-wide opportunity. Here's the generalization:

**Current infrastructure:**

- Guard has `scripts/packed-dangling-baseline-smoke.mjs` (360 LOC) — smoke-tests the unpacked tarball.
- Core has nothing equivalent.
- Projection has a perf-gate + baseline comparator (280 LOC).

**Promotion opportunity:**
Create a **workspace-level `scripts/pack-smoke.mjs`** that:

1. Packs each of the 5 publishable packages (`architect-core`, `architect-projection`, `architect-guard`, `architect-cli`, `architect-mcp`).
2. Untars each into a temp directory.
3. For each, **symlinks node_modules (zod, the core types, etc.) and dynamic-imports the entry point** to validate the basic import path works.
4. Runs package-specific sub-smoke tests:
   - **Core:** validates that `PatternGraphSchema` parses; `PatternGraphAPI` constructs; no broken exports.
   - **Guard:** current smoke test (dangling-baseline resource check + negative path).
   - **Projection:** validates that core types resolve and `parseAndProject` works on a fixture.
   - **CLI:** imports and validates each of the 5 bins can be required.
   - **MCP:** validates that the MCP session can be constructed.

**Location:** `/Users/darkomijic/dev-projects/architect/scripts/pack-smoke.mjs` (workspace root, not per-package).

**Wiring into CI:** Once `.github/workflows/ci.yml` lands (core CI-1), add:

```yaml
jobs:
  publish-contract:
    runs-on: ubuntu-latest
    if: success() # after lint/typecheck/test
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: node scripts/pack-smoke.mjs
```

This gate runs on every PR. It would have caught:

- **Core C-CORE-1** (`./roles` export missing).
- **Core CL-CORE-4** (`self-hosting.ts` module-load cost).
- **Guard Cleanup-C-GUARD-3** (if the `dangling-baseline.json` build-time copy were fragile on the consumer side).
- Any cross-package export breakage.

**Effort:** ~100 LOC refactor of guard's existing script + 100 LOC per-package sub-tests. Medium-lift, family-wide benefit.

## Publish pipeline audit

### Lifecycle hook placement (vs family baseline)

| Setting               | Guard                      | Core                           | Siblings    | Verdict     |
| --------------------- | -------------------------- | ------------------------------ | ----------- | ----------- |
| `prepack` location    | `scripts` ✓                | JSON root (broken — CL-CORE-1) | all correct | **ALIGNED** |
| `prepack` command     | `pnpm clean && pnpm build` | `pnpm build` (incomplete)      | aligned     | **ALIGNED** |
| `prepare` hook        | Not used                   | Not used                       | Not used    | N/A         |
| `prepublishOnly` hook | Not used                   | Not used                       | Not used    | N/A         |

### `package.json#exports` audit

Guard declares:

```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js"
  },
  "./package.json": "./package.json"
}
```

**Verdict:**

- ✓ No broken exports (unlike core's `./roles`).
- ✓ Entry point (`dist/index.js` + `dist/index.d.ts`) is valid.
- ✗ **No curated subpaths** for the 4 CLI bins or the 9 external API symbols. Phase 2 Cleanup-H-GUARD-1 recommends explicit named exports to replace the 12 wildcards in `src/index.ts`; post-cleanup, add subpaths:
  ```json
  "exports": {
    ".": "./dist/index.js",
    "./cli": "./dist/cli/shared.js",
    "./package.json": "./package.json"
  }
  ```
  (Minimal MVP; can expand if consumers request `./lint/dangling-baseline`, etc.)

**Context:** Phase 2 established that ~94% of the barrel is dead surface (internal-only). Subpaths serve two purposes: (1) signal which symbols are stable API, (2) enable tree-shaking for consumers. Post-cleanup, both are achievable.

**Sequencing:** Land after Cleanup-H-GUARD-1 (barrel curation). Not blocking publish.

### `publishConfig` audit

```json
"publishConfig": {
  "access": "public",
  "provenance": true
}
```

| Concern            | Status                      | Notes                                                              |
| ------------------ | --------------------------- | ------------------------------------------------------------------ |
| `access: public`   | ✓ Correct                   | Package is published to npm public registry.                       |
| `provenance: true` | **Declared, unimplemented** | No workflow to issue SLSA attestation. Family blocker (core CI-2). |

**Recipe:** Once `.github/workflows/publish.yml` lands (core CI-2), guard automatically benefits. No per-package action required.

### `files` allowlist audit

```json
"files": ["dist"]
```

**Verdict:** Correct and tight. Allows only the dist directory (no source, no scripts, no test fixtures, no dangling-baseline.json in root).

**Post-Phase-2 cleanup:** After `tier-a-baseline.ts` deletion, the allowlist remains unchanged (all tier-a data is deleted from source, not moved to root). No action.

### Dependency audit (runtime vs devDeps)

| Package                     | Declared     | Used in `src/`                               | Verdict                                 |
| --------------------------- | ------------ | -------------------------------------------- | --------------------------------------- |
| `@libar-dev/architect-core` | workspace:\* | yes — process-guard imports core's FSM types | ✓ Correct                               |
| `glob`                      | ^10.3.10     | yes — 4 import sites                         | ✓ Correct, pinned identically to core   |
| `zod`                       | ^4.1.11      | yes — pervasive                              | ✓ Correct, pinned identically to family |

**devDeps:**

- `@amiceli/vitest-cucumber`, `@types/node`, `eslint`, `typescript`, `vitest` — all pinned identically to siblings ✓
- ESLint is explicit in guard (unlike core, which relies on root hoist) ✓

**Verdict:** Dependencies are pristine. Zero drift. No phantom deps. No devDep leak into `src/`.

### Tarball composition (pre-Phase-2)

Current state (after Phase 3 measurement):

- **Size:** 972 KB on disk; ~583 KB packed (per Phase 2 raw/2B inventory).
- **Files:** 153 total; 76 are `.map` files (50% of file count).
- **Content breakdown:**
  - `tier-a-baseline.js` + `.js.map`: 45.8 KB (7.8% of tarball).
  - Sourcemaps: ~291 KB (50% of packed size).
  - Remaining source: ~246 KB.

**Post-Phase-2 cleanup projection:**
After Cleanup-C-GUARD-2 (`tier-a-baseline.ts` deletion) + family CL-CORE-3 (sourceMap disable):

- `tier-a-baseline` removed: -45.8 KB.
- Sourcemaps disabled: -~145 KB.
- **Projected size:** 583 - 45.8 - 145 ≈ **392 KB packed** (46% reduction).
- **Projected files:** 153 - 76 (maps) ≈ **77 files** (50% reduction).

Exact numbers depend on whether Phase 2 splits introduce new `.d.ts` width (unlikely; Cleanup-H-SIMP-1 split `validate-patterns.ts` into 6 files but same total LOC).

## Family-wide script drift status for guard

**Guard's configuration:**

| Setting                  | Value                                                                 | Aligned?                                                                     |
| ------------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `prepack`                | `pnpm clean && pnpm build`                                            | ✓ Yes (matches siblings)                                                     |
| `lint`                   | `eslint src tests`                                                    | ✓ Yes (aligned; core drifts: `src` only)                                     |
| `typecheck`              | `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.test.json` | ✓ Yes (most disciplined; core/projection drift)                              |
| `test`                   | `pnpm typecheck && vitest run --config vitest.config.ts`              | ✓ Yes (aligned; core/projection drift: no typecheck guard)                   |
| `vitest.include` pattern | `tests/**/*.steps.ts`                                                 | ⚠ Family drift (core: `tests/steps/**`; projection/mcp: `tests/features/**`) |

**Verdict:** Guard is the family benchmark for script discipline. Only drift is `vitest.include` (3-way split: guard/core use suffix-based patterns; projection/mcp use directory-based). Recommend picking one family convention (either `tests/features/**` to match projection's audit-script-driven convention, or `tests/**/*.steps.ts` to match the BDD naming).

**Sequencing:** Family-wide normalization PR (core CL-CORE-14 equivalent). Not per-package.

## Operational risks for runtime consumers

Guard is consumed in two contexts:

### 1. **Dependency by `architect-cli` (static import)**

**Risk level:** LOW

- `architect-cli` imports guard's CLI entrypoints (`runValidatePatternsCli`, `runLintStepsCli`, etc.) at startup.
- Guard has no module-load side effects (`sideEffects: false`; verified by Phase 2 grep).
- No unbounded caches or leaked resources.
- **Mitigation:** Dependency upgrades are automatic via pnpm resolution. No special long-running risk.

### 2. **Dogfood in pre-commit hook (`pnpm architect:guard --staged`)**

**Risk level:** MEDIUM

From Phase 1 H-GUARD-2 and AGENTS.md:165:

```json
{
  "scripts": {
    "architect:guard": "node dist/cli/validate-patterns.js && node dist/cli/lint-patterns.js && node dist/cli/lint-process.js && node dist/cli/lint-steps.js"
  }
}
```

(Actual command may differ; Phase 1 flagged `ProcessGuard` symbol doesn't exist in the barrel. Phase 2 Cleanup-H-GUARD-1 addresses this.)

**Risks:**

- **CLI startup latency:** `architect:guard` runs **4 separate bin invocations** on every staged commit. Each is a Node.js process with full TypeScript load + schema parsing. No measurement available, but likely 1-2 seconds total.
  - _Mitigation:_ Consider composing the 4 bins into a single `architect-guard` CLI with subcommands, or lazy-loading the sub-checks. Not critical pre-1.0; acceptable for pre-commit.
- **Tarball-size creep:** If guard's tarball grows, each `pnpm install` (CI, developer onboarding) becomes slower. Phase 2 Cleanup-C-GUARD-2 addresses the single largest bloat vector (tier-a-baseline).
  - _Mitigation:_ Post-cleanup tarball audit + Phase 2 CL-CORE-3 (sourcemaps) should stabilize size.

- **Breaking dependency changes:** Guard depends on core. If core lands a breaking change in the FSM (Phase 2 M-SIMP-2, core C-CORE-5 recipe), guard's `decider.ts` must update in the same release cycle.
  - _Mitigation:_ Coordinated release PR; CI validation (once CI lands) ensures the contract doesn't break.

## Recommendations summary

### Immediate (one-line fix, no CI required)

1. **Wire `packed-dangling-baseline-smoke.mjs` to `prepack`** (TC-H-GUARD-7 operationalization).
   ```json
   "prepack": "pnpm clean && pnpm build && node scripts/packed-dangling-baseline-smoke.mjs"
   ```

   - Local-CI equivalent. Catches tarball-composition regressions before `pnpm publish`.
   - Would have caught core C-CORE-1 (broken `./roles`).

### Phase 2 cleanup (bundled with code cleanup)

2. **After Cleanup-H-GUARD-1 (barrel curation):** Add explicit subpaths to `exports`:
   ```json
   "exports": {
     ".": "./dist/index.js",
     "./package.json": "./package.json"
   }
   ```

   - Signals stable API surface to consumers.

### Family-wide effort (not per-package)

3. **Promote `packed-dangling-baseline-smoke.mjs` to workspace `scripts/pack-smoke.mjs`** (Cleanup-H-GUARD-4 family implementation).
   - Covers all 5 publishable packages.
   - Wire into CI `publish-contract` job (after core CI-1/CI-2 land).
   - Medium-lift, high-leverage gate for any export/resource breakage.

4. **Vitest pattern normalization** (CL-CORE-14 family PR).
   - Guard uses `tests/**/*.steps.ts`; core `tests/steps/**`; projection/mcp `tests/features/**`.
   - Pick one; update all 5 packages in one PR.

5. **Core's CI-2 prerequisite:** Once `.github/workflows/publish.yml` lands (issuing SLSA attestations), guard's `publishConfig.provenance: true` becomes effective automatically.

## Critical context for Phase 5

1. **`packed-dangling-baseline-smoke.mjs` wire-up is the Phase 4B deliverable that pairs with Phase 3 TC-H-GUARD-7.** It's the only publish-time contract test in the family and ready to run.

2. **Tarball after Phase 2 cleanup:** Expect 583 KB → ~392 KB (46% reduction) with the combination of `tier-a-baseline` deletion + family `sourceMap`/`declarationMap` disable.

3. **Guard is the family template for script discipline** — most packages should align their `lint`, `typecheck`, `test`, `prepack` to match guard's posture.

4. **The one operational risk (CLI startup latency in pre-commit) is not critical pre-1.0** but worth measuring post-cleanup and considering for a future convenience refactor (composite CLI).

## Files referenced

- `/Users/darkomijic/dev-projects/architect/packages/architect-guard/package.json` — scripts, exports, publishConfig.
- `/Users/darkomijic/dev-projects/architect/packages/architect-guard/scripts/packed-dangling-baseline-smoke.mjs` — existing smoke-test implementation.
- `/Users/darkomijic/dev-projects/architect/packages/architect-guard/scripts/copy-dangling-baseline.mjs` — build-time copy helper (model for workspace `pack-smoke.mjs` refactor).
- Core CI-2 parallel: `/Users/darkomijic/dev-projects/architect/packages/architect-core/04-best-practices.md` (§CI/DevOps audit).
- Projection parallel: `/Users/darkomijic/dev-projects/architect/packages/architect-projection/04-best-practices.md` (§Cleanup-C-PROJ-1 perf gate).
