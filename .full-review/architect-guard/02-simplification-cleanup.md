# architect-guard — Phase 2 Consolidated: Simplification & Cleanup

**Sources:** `raw/2A-simplification.md` + `raw/2B-cleanup.md`. Replaces orchestrator's default Security+Performance phase.

## Executive Summary

Phase 2 surfaces **three corrections to Phase 1 framing** plus one **family-wide opportunity**:

1. **Dead surface is 94%, not "high".** Cleanup-agent grep across the workspace shows **only 9 of ~150 barrel-exposed symbols are consumed externally** (`runValidatePatternsCli`, `runLintStepsCli`, `runLintPatternsCli`, `runLintProcessCli`, `compareDanglingBaseline`, `writeDanglingBaseline`, `DANGLING_BASELINE_SOURCE_PATH`, `DanglingBaselineComparison`, `DanglingBaselineEntry`). Phase 1 H-GUARD-1 said "12 wildcards make the contract unidentifiable"; Phase 2 confirms the contract is nearly empty. The 12 wildcards (`git/`, `cli/shared.ts`, `lint/engine.ts`, `lint/rules.ts`, `lint/steps/`, `lint/idea-tier/`, `validation/anti-patterns.ts`, `validation/dod-validator.ts`, `validation/types.ts`, etc.) have **zero external consumers**.

2. **`tier-a-baseline.ts` is 45.8KB / 7.8% of the tarball** — only consumed by guard's own `src/cli/lint-patterns.ts:45,311,353`. Phase 1 framed this as "ships through public barrel" and "locks the family" — both true, but also a tarball-bloat issue. Combined with the dead-surface deletion, **~46% tarball reduction with zero behavioral change for any current consumer**.

3. **Phase 1 H-GUARD-3 (`git/` module re-homing) was wrong-direction.** Phase 1 said move to core because "consumed by core." Phase 2 grep contradicts: `git/` is **only consumed by `process-guard/detect-changes.ts` inside guard**. The correct refactor: **demote** to `src/lint/process-guard/_git/` and drop the (incorrect) `@architect-bounded-context:generator` annotation. Phase 2 supersedes Phase 1's recommendation here.

4. **`packed-dangling-baseline-smoke.mjs` is the only post-pack publish-contract test in the family.** It untars, symlinks zod, imports the dist module, exercises the missing-resource negative path. **Not wired into `test`, `prepack`, or any CI**. **Generalizing this to a workspace-level `pack-smoke.mjs` would have caught core's broken `./roles` export pre-publish.** Family-wide promotion opportunity comparable to projection's audit scripts.

The five highest-leverage simplifications (Phase 2A) account for ~1,150 LOC deletion and close all 4 Critical + 6 of 14 High findings:

1. **`tier-a-baseline.ts` 1,138 LOC → ~70 LOC** (JSON file + Zod schema + `parseAtBoundary` loader + `--baseline` CLI flag). Recipe mirrors `dangling-baseline.ts`.
2. **`process-guard/types.ts` 14 interfaces → `z.infer`** (C-GUARD-3 sweep). `DEFAULT_THRESHOLDS = AntiPatternThresholdsSchema.parse({})` eliminates parallel-data drift.
3. **Three `parseAtBoundary` sites + three FSM cast removals** (C-GUARD-4 + C-GUARD-1). All depend on one core export (`isValidProcessStatus`).
4. **`loadConfig` deletion** (H-GUARD-4): 12-line wrapper; 4 of 6 callers already use `loadProjectConfig`.
5. **Phantom PDR-005 cleanup** (H-GUARD-8): **5 references in guard** (`lint/process-guard/{index,types,decider}.ts`, `cli/lint-process.ts:170` — load-bearing in CLI help output) **+ 1 in core's `taxonomy/registry-builder.ts:162`** that Phase 1 didn't catch. Decision: author the PDR (the FSM enforcement IS decision-worthy) or strip all 6 references.

## Critical (P0)

| ID                    | Title                                                                                                               | Source |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- | ------ |
| Cleanup-C-GUARD-1     | **94% dead surface** through `src/index.ts` barrel — Phase 1 H-GUARD-1 sharpened by grep                            | 2B     |
| Cleanup-C-GUARD-2     | **`tier-a-baseline.ts` 45.8KB / 7.8% of tarball** with zero cross-package callers — Phase 1 C-GUARD-2 sharpened     | 2B     |
| Cleanup-C-GUARD-3     | **`packed-dangling-baseline-smoke.mjs` not wired into CI** — family's only post-pack publish-contract test, dormant | 2B     |
| (Phase 1 reconfirmed) | C-GUARD-1 (FSM cast collapse), C-GUARD-3 (process-guard types not Zod-first), C-GUARD-4 (parseAtBoundary unused)    | both   |

**Recipes (Phase 2A §1-§3 + 2B):**

```ts
// 1. tier-a-baseline.ts — full recipe (2A §1, 70 LOC total):

// architect/tier-a-baseline.json (new — dogfood data, repo root)
[];

// src/lint/tier-a-baseline.ts (new — schema + loader, ~70 LOC)
import { parseAtBoundary } from '@libar-dev/architect-core';
import { z } from 'zod';

export const TierABaselineEntrySchema = z.strictObject({
  file: z.string(),
  pattern: z.string(),
  reason: z.string(),
});
export const TierABaselineSchema = z.array(TierABaselineEntrySchema).readonly();
export type TierABaselineEntry = z.infer<typeof TierABaselineEntrySchema>;
export type TierABaseline = z.infer<typeof TierABaselineSchema>;

export const TIER_A_BASELINE_SOURCE_PATH = './tier-a-baseline.json';

export function loadTierABaseline(path?: string): TierABaseline {
  const filePath = path ?? bundledPath();
  if (!existsSync(filePath)) return [];
  const content = readFileSync(filePath, 'utf-8');
  const json = JSON.parse(content);
  return parseAtBoundary(TierABaselineSchema, json, 'loadTierABaseline');
}

// scripts/copy-baselines.mjs (extended) — copies BOTH baselines now

// src/cli/lint-patterns.ts:45 — accept --baseline override
const baseline = loadTierABaseline(argv.baseline);
```

```ts
// 2. process-guard/types.ts — full sweep recipe (2A §2):

export const AntiPatternThresholdsSchema = z.strictObject({
  // ... explicit shape with .default() per field
  maxRefactorWithoutDecisionDays: z.number().int().min(0).default(14),
  maxIdeasInIdea: z.number().int().min(0).default(50),
  // ... etc
});
export type AntiPatternThresholds = z.infer<typeof AntiPatternThresholdsSchema>;
export const DEFAULT_THRESHOLDS = AntiPatternThresholdsSchema.parse({});
// All 14 hand-written interfaces → similar treatment.
```

```ts
// 3. parseAtBoundary at 3 sites (2A §3):

// detect-changes.ts:414, 440, 452 — replace casts
const fromStatus = parseAtBoundary(StatusValueSchema, match[1], 'parseFsmDiff');

// dangling-baseline.ts:102 — replace JSON.parse
const baseline = parseAtBoundary(
  DanglingBaselineSchema,
  JSON.parse(content),
  'loadDanglingBaseline',
);

// CLI argv (per bin):
const argv = parseAtBoundary(LintPatternsArgvSchema, process.argv.slice(2), 'lint-patterns-argv');
```

## High (P1)

| #                 | Title                                                                                                          | Source | Action                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------- |
| Cleanup-H-GUARD-1 | `src/index.ts` 12 wildcards → 8 named exports actually consumed by cli                                         | 2B     | One PR, breaking change OK (No-BC).                                          |
| Cleanup-H-GUARD-2 | `tier-a-baseline.ts` deletion (45.8KB tarball reduction)                                                       | 2B     | Sweep 1 of action plan.                                                      |
| Cleanup-H-GUARD-3 | **`git/` module → `process-guard/_git/`** (Phase 2 supersedes Phase 1 H-GUARD-3 wrong-direction recipe)        | 2B     | Demote, not promote. Drop `@architect-bounded-context:generator` annotation. |
| Cleanup-H-GUARD-4 | Promote `packed-dangling-baseline-smoke.mjs` to workspace-level `pack-smoke.mjs`                               | 2B     | Would have caught core C-CORE-1 pre-publish.                                 |
| Cleanup-H-GUARD-5 | `dangling-baseline.json` is empty `[]` — the entire dual-write apparatus exists for a zero-entry fixture today | 2B     | Document the intent or simplify.                                             |
| H-SIMP-1          | `validate-patterns.ts` 935 LOC mixing 8 concerns split into 6 files                                            | 2A §5  | Mechanical split.                                                            |
| H-SIMP-2          | `loadConfig` deletion (12 lines, mostly-migrated callers)                                                      | 2A §4  | Pure migration.                                                              |
| H-SIMP-3          | Phantom PDR-005 cleanup — author or strip 6 references                                                         | 2A §6  | Decision then mechanical.                                                    |
| H-SIMP-4          | `src/index.ts` curated 12 wildcards → 8 explicit named exports                                                 | 2A §7  | Pairs with Cleanup-H-GUARD-1.                                                |
| H-SIMP-5          | `getDeliverableWorkflowPatterns` → core's `PatternGraphAPI`                                                    | 2A §8  | Cross-package move; coordinate with core.                                    |
| H-SIMP-6          | Add `--baseline` override to `tier-a-baseline` CLI                                                             | 2A §1  | Bundled with tier-a deletion.                                                |
| H-SIMP-7          | FSM transition tests in guard (`tests/features/validation/fsm-transitions-via-guard.feature`)                  | 2A     | Closes C-GUARD-1; pairs with core TD-CORE-3.                                 |

## Medium (P2)

| #                 | Title                                                                                                                                                    | Source |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Cleanup-M-GUARD-1 | `AntiPatternThresholdsSchema` is the only open `z.object` in guard + parallel `DEFAULT_THRESHOLDS` data literal (3-line fix)                             | 2B     |
| Cleanup-M-GUARD-2 | `node:` prefix inconsistency in 6 files (idea-tier/runner, steps/pair-resolver, steps/runner, process-guard/derive-state, detect-changes, anti-patterns) | 2B     |
| Cleanup-M-GUARD-3 | vitest `include` pattern drift family-wide (guard uses `tests/**/*.steps.ts`; core `tests/steps/**`; projection/mcp `tests/features/**`)                 | 2B     |
| Cleanup-M-GUARD-4 | `validateCompletionMetadata` gap when core deletes (Phase 1 H-GUARD-9 confirmed) — guard has no equivalent                                               | 2B     |
| Cleanup-M-GUARD-5 | `src/cli/shared.ts` has no consumers beyond guard's own bins                                                                                             | 2B     |
| Cleanup-M-GUARD-6 | `git/` module annotation `@architect-bounded-context:generator` is wrong regardless of re-homing decision                                                | 2B     |
| M-SIMP-1          | `detect-changes.ts` regex captures cleanup after `parseAtBoundary` lands                                                                                 | 2A     |
| M-SIMP-2          | Dual `loadConfig`/`loadProjectConfig` — covered by H-SIMP-2                                                                                              | 2A     |
| M-SIMP-3          | `dangling-baseline.ts` consumer-side absence robustness (H-GUARD-13)                                                                                     | 2A     |
| M-SIMP-4          | `process-guard-rules.feature:43-48` phantom upstream suite reference cleanup                                                                             | 2A     |
| M-SIMP-5          | Anti-pattern detector emits via `console.log` rather than diagnostic channel                                                                             | 2A     |

## Low (P3) — abbreviated

~10 items: regex hoisting, error-message capitalization, dead exports, stale W7/W1.5 work comments, `tests/.DS_Store`, `Array.from`/`new Array` micro-optimizations.

## Configuration audit (vs family base configs)

| Setting                  | Guard                                                    | Verdict                                                                                             |
| ------------------------ | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `prepack` location       | scripts ✓                                                | Aligned.                                                                                            |
| `prepack` command        | `pnpm clean && pnpm build`                               | Aligned.                                                                                            |
| `lint` glob              | `eslint src tests`                                       | Aligned.                                                                                            |
| `typecheck` scope        | **both `tsconfig.json` AND `tsconfig.test.json`**        | **Most disciplined `typecheck` posture in family** (only `cli` matches).                            |
| `test` chain             | `pnpm typecheck && vitest run --config vitest.config.ts` | Aligned with discipline.                                                                            |
| `eslint` in devDeps      | Explicit                                                 | Aligned.                                                                                            |
| `vitest.include` pattern | `tests/**/*.steps.ts`                                    | **Family drift** — core uses `tests/steps/**`; projection/mcp use `tests/features/**`. Pick one.    |
| `package.json#exports`   | only `.` and `./package.json`                            | **Sparse** — no curated subpaths. After Cleanup-H-GUARD-1, define explicit subpaths for the 6 bins. |
| `node:` prefix in src/   | Inconsistent (6 files use bare `fs`/`path`)              | Sweep.                                                                                              |

## Dependency audit

| Dep                                        | Version                                                                                                           | Used in src?         | Notes                       |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | -------------------- | --------------------------- |
| `@libar-dev/architect-core` (workspace:\*) | local                                                                                                             | yes                  | Only workspace runtime dep. |
| `glob` ^10.3.10                            | aligned with core                                                                                                 | yes — 4 import sites | Genuinely used.             |
| `zod` ^4.1.11                              | aligned with family                                                                                               | yes — pervasive      | Aligned.                    |
| devDeps                                    | `@amiceli/vitest-cucumber ^6.3.0`, `@types/node ^24.12.0`, `eslint ^9.17.0`, `typescript ^5.8.2`, `vitest ^4.1.4` | aligned              | All five pins match family. |

**Verdict: dependencies are pristine.** Zero drift. No unique-to-guard deps beyond `glob` (which core also uses). Zero phantom deps; no devDep leaks into `src/`.

## Dead-surface analysis

From `src/index.ts`'s 12 wildcards, only these are consumed externally:

| Symbol                                                                                 | Source                      | Consumer             |
| -------------------------------------------------------------------------------------- | --------------------------- | -------------------- |
| `runValidatePatternsCli`, `runLintStepsCli`, `runLintPatternsCli`, `runLintProcessCli` | `cli/`                      | `architect-cli` bins |
| `compareDanglingBaseline`, `writeDanglingBaseline`                                     | `lint/dangling-baseline.ts` | `architect-cli`      |
| `DANGLING_BASELINE_SOURCE_PATH`                                                        | `lint/dangling-baseline.ts` | `architect-cli`      |
| `DanglingBaselineComparison`, `DanglingBaselineEntry`                                  | `lint/dangling-baseline.ts` | `architect-cli`      |

**~141 of ~150 symbols have zero external consumers.** Recipe: replace 12 wildcards in `src/index.ts` with 9 explicit named exports. **Pre-1.0 No-BC: this is the right time.**

## Files that should not be in `dist/`

| Path pattern                                       | Count / Size                 | Action                                   |
| -------------------------------------------------- | ---------------------------- | ---------------------------------------- |
| `dist/**/*.{js,d.ts}.map`                          | ~35% of bytes (54/155 files) | Family-wide CL-CORE-3 fix.               |
| `dist/lint/tier-a-baseline.{js,js.map}`            | 45.8KB (7.8%)                | Delete file; replace with JSON loader.   |
| `dist/git/**` (post-demotion)                      | ~12 KB                       | Move to `dist/lint/process-guard/_git/`. |
| `dist/cli/shared.{js,d.ts}` (no external consumer) | small                        | Internal-only; mark `.internal.ts`.      |

After all cleanups: **583 KB → ~315 KB (46% reduction)** with zero behavioral change.

## The dangling-baseline machinery review

- `architect/dangling-baseline.json` is **empty `[]` today**. The dual-write + build-time copy + smoke-test apparatus exists for zero entries.
- `dangling-baseline.ts:102` reads + parses without `parseAtBoundary` (covered by C-GUARD-4).
- `packed-dangling-baseline-smoke.mjs` is excellent infrastructure (untars + symlinks zod + dynamic imports the dist module). **Worth promoting workspace-level** as the only post-pack contract test the family has. Would have caught core's `./roles` (C-CORE-1) pre-publish.
- Recipe for `tier-a-baseline` deletion mirrors `dangling-baseline.ts` exactly — same JSON, schema, loader, copy script extension.

## Recommended landing order

1. **Sweep 1 (1 hour):** Cleanup-H-GUARD-1 + Cleanup-C-GUARD-1 (barrel curation). 12 wildcards → 9 named exports. Breaks no current consumer.
2. **Sweep 2 (1-2 hours):** `process-guard/types.ts` Zod-first sweep (C-GUARD-3 + Cleanup-M-GUARD-1). 14 interfaces → `z.infer`. `AntiPatternThresholdsSchema` strict + `DEFAULT_THRESHOLDS.parse({})`.
3. **Sweep 3 (depends on core C-CORE-5 fix):** FSM cast removal in `detect-changes.ts` + `decider.ts` using core's new `isValidProcessStatus`. Add `parseAtBoundary` at three boundaries. Land FSM tests in guard AND core in the same PR.
4. **Sweep 4 (4 hours):** `tier-a-baseline.ts` deletion + JSON migration + extended `copy-baselines.mjs` build copier. Cleanup-C-GUARD-2.
5. **Sweep 5 (1 hour):** Phantom PDR-005 cleanup (Cleanup-H-GUARD-8). Decision: author or strip.
6. **Sweep 6 (cross-package):** `validate-patterns.ts` split (H-SIMP-1); `getDeliverableWorkflowPatterns` → core (H-SIMP-5); `git/` demotion to `process-guard/_git/` (Cleanup-H-GUARD-3, supersedes Phase 1 H-GUARD-3).
7. **Sweep 7 (family-wide):** Promote `packed-dangling-baseline-smoke.mjs` to workspace `pack-smoke.mjs` (Cleanup-C-GUARD-3). Wire into CI when CI lands.
8. **Sweeps 8+:** Medium and Low items.

## What's healthy (preserve)

- Zero suppressions in src.
- Most disciplined `typecheck` posture in family.
- `dangling-baseline.ts` is the right shape — preserve as the reference for the `tier-a-baseline` refactor.
- `packed-dangling-baseline-smoke.mjs` is unique infrastructure worth promoting family-wide.
- Dependencies pristine (zero drift, no phantom deps, no devDep src leaks).
- No 5th `buildRoleLookup`, no `fuzzy-match` duplicates, no F4A-H-6 `.extend` exposure — clean cross-package.

## Critical context for Phase 3

- **Test-to-source ratio worst in family** (3 features / 5 step files / 9,135 SLOC). Phase 3 will need to flag prominently.
- **FSM transition tests are missing on both sides** (core + guard) — Phase 3 testing review should propose tests landing in coordinated PRs with core's TD-CORE-3.
- **`packed-dangling-baseline-smoke.mjs`** is a test asset Phase 3 should evaluate — it's unique in the family. Worth promoting + extending.
- **Phantom feature suite reference** at `process-guard-rules.feature:43-48` should be either fixed (create the missing suite) or removed (delete the deferral).
- **`process-guard-rules.feature`** is narrative-only — Phase 3 should verify whether it actually exercises any code path or is documentation-as-feature.
