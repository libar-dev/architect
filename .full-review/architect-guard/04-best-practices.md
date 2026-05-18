# architect-guard — Phase 4 Consolidated: Best Practices & Standards

**Sources:** `raw/4A-language-framework.md` (typescript-pro) + `raw/4B-ci-devops.md` (deployment-engineer). Findings tagged **[4A]**, **[4B]**, or **[4A+4B]**.

## Executive Summary

The 4A reviewer's reframe sharpens guard's posture: **guard doesn't need to invent any Zod 4 or TS 5 idiom** — all 8 projection family-reference patterns apply directly. Total cost of full doctrine compliance: ~+200 net LOC.

Two findings restructure the family-wide cleanup plan:

1. **`isValidStatusValue` is already written in core at `validation/fsm/validator.ts:52` as a non-exported local function.** `ProcessStatusSchema = z.enum(PROCESS_STATUS_VALUES)` also exists at `domain-enums.ts:26` but isn't re-exported under the `StatusValueSchema` name. **One `function` → `export function` edit + 2 re-export lines in core unblocks: (a) guard's 3 cast sites at `detect-changes.ts:414,440,452`, (b) projection's 3 `Set.has` narrowing sites (M-PROJ-F-4), (c) the C-CORE-5 FSM trust-boundary recipe.** Highest cross-package leverage in the entire family review.

2. **`packed-dangling-baseline-smoke.mjs` wired to `prepack` is the local-CI equivalent of projection's perf-gate wire-up.** One-line fix gates publication and catches regressions like core's broken `./roles` export. Worth promoting to workspace-level `pack-smoke.mjs` (Cleanup-H-GUARD-4).

The CI/DevOps audit confirms guard is **the family benchmark for script discipline** (correct `prepack` placement, family-best `typecheck` scope covering both configs, aligned `lint`/`test` chains). Tarball bloat: 583 KB → ~392 KB projected post-Phase-2 cleanup (`tier-a-baseline` deletion + family-wide sourceMap disable). Zero language-strictness evasion clusters (no 16× Map casts like core, no `[key: string]: unknown` index escape hatches).

Three NEW Phase 4 findings beyond Phases 1-3:

- **F4A-G-H-2: Zero `.brand<>()` declarations across 38 files in guard.** Family-wide gap. `git/` returns `readonly string[]` everywhere; `sanitizeBranchName(branch: string): string` should be a brand constructor. Core has 6 brands in `types/branded.ts` — guard should consume them.
- **F4A-G-H-3: 4 CLI bins parse argv by hand into hand-rolled `interface XCLIConfig`** (~360 LOC, zero Zod at trust boundary). `parseInt + isNaN` × 5 in `validate-patterns.ts:222-255` collapses into `z.coerce.number()` inside a Zod argv schema.
- **F4A-G-H-5: 3 `void main()` async-call sites that evade `no-suppression-comments`** — same hazard as core F4A-H-9.

Plus one Phase 2 count correction: `node:` prefix inconsistency is **7 files, not 6** — `detect-changes.ts:35-36` mixes both styles in adjacent lines.

## Critical (P0)

### F4A-G-1. `isValidStatusValue` written-but-unexported in core — single-edit unblocks family **[4A]**

`architect-core/src/validation/fsm/validator.ts:52` has `function isValidStatusValue(...)` as a non-exported local function. `architect-core/src/domain-enums.ts:26` has `ProcessStatusSchema = z.enum(PROCESS_STATUS_VALUES)` but it isn't re-exported under the `StatusValueSchema` name. **Recipe (one-line core edit):**

```ts
// architect-core/src/validation/fsm/validator.ts:52
- function isValidStatusValue(value: unknown): value is ProcessStatusValue {
+ export function isValidStatusValue(value: unknown): value is ProcessStatusValue {
    return typeof value === 'string' && PROCESS_STATUS_VALUES.includes(value as ProcessStatusValue);
  }

// architect-core/src/validation/fsm/index.ts (barrel — add)
export { isValidStatusValue } from './validator.js';
export { ProcessStatusSchema as StatusValueSchema } from '../../domain-enums.js';
```

**Unblocks 3 guard cast sites (C-GUARD-1) + 3 projection `Set.has` sites (M-PROJ-F-4) + the C-CORE-5 FSM recipe simultaneously.** Highest cross-package leverage in this review.

### F4A-G-2 / Phase 1 C-GUARD-3 reconfirmed. `AntiPatternThresholdsSchema` open `z.object` + parallel data literal **[4A]**

`validation/types.ts:81` is the sole `z.object` in guard. Parallel hand-written `DEFAULT_THRESHOLDS` at `:95-99`. **Recipe (3-line fix bundled with Phase 2 C-GUARD-3 sweep):**

```ts
export const AntiPatternThresholdsSchema = z.strictObject({
  maxRefactorWithoutDecisionDays: z.number().int().min(0).default(14),
  // ... explicit shape with .default() per field
});
export type AntiPatternThresholds = z.infer<typeof AntiPatternThresholdsSchema>;
export const DEFAULT_THRESHOLDS = AntiPatternThresholdsSchema.parse({});
```

### CI-G-C-1. `packed-dangling-baseline-smoke.mjs` unwired (Phase 3 TC-H-GUARD-7 sharpened) **[4B]**

**Recipe (one line in `package.json`):**

```diff
-    "prepack": "pnpm clean && pnpm build",
+    "prepack": "pnpm clean && pnpm build && node scripts/packed-dangling-baseline-smoke.mjs",
```

The script untars the packed `.tgz`, symlinks `zod`, imports the dist module, and exercises the missing-resource negative path. Catches dist-resource regressions before every publish. Local-CI; no GitHub Actions required to land. Pairs with TC-H-GUARD-7 (already in Phase 3 recipe).

### CI-G-C-2. `@architect-bounded-context:generator` annotation on all 4 `git/` files **[4B]** (reconfirms DOC-H-GUARD-1)

Wrong annotation; doctrine defect under "Architect State is Code." Recipe: change to `:process-guard` regardless of Phase 2 demotion timing (Cleanup-H-GUARD-3). Independent of demote-vs-keep decision.

## High (P1)

### Language / framework (4A — additive)

| #         | Title                                                                                                                                                                                                                                                                      | Location                                                                      |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| F4A-G-H-1 | 14 hand-written interfaces in `process-guard/types.ts`, zero `z.infer` (reconfirms C-GUARD-3)                                                                                                                                                                              | `src/lint/process-guard/types.ts`                                             |
| F4A-G-H-2 | **Zero `.brand<>()` declarations across 38 files.** `git/` returns stringly-typed everywhere; `sanitizeBranchName(branch: string): string` should be a brand constructor. **Family-wide gap** — core owns 6 brands; guard should consume.                                  | `src/git/`, `src/cli/`                                                        |
| F4A-G-H-3 | **4 CLI bins parse argv by hand** into hand-rolled `interface XCLIConfig` (~360 LOC), zero Zod at trust boundary. `parseInt + isNaN` × 5 in `validate-patterns.ts:222-255`. **Recipe:** `z.coerce.number()` inside Zod argv schema; collapses 5 `parseInt + isNaN` checks. | 4 files in `src/cli/`                                                         |
| F4A-G-H-4 | `parseAtBoundary` adoption at 3 sites (reconfirms C-GUARD-4)                                                                                                                                                                                                               | `detect-changes.ts:414,440,452`, CLI argv parsing, `dangling-baseline.ts:102` |
| F4A-G-H-5 | **3 `void main()` async-call sites evade the local `no-suppression-comments` rule** — same hazard as core F4A-H-9. The `no-restricted-syntax` rule core proposes also catches these.                                                                                       | 3 CLI entrypoint files                                                        |

### CI / DevOps (4B — additive)

| #        | Title                                                                                                          | Action                                                                                                                                                             |
| -------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CI-G-H-1 | Subpath `exports` map is sparse (only `.` + `./package.json`)                                                  | After Phase 2 Cleanup-H-GUARD-1 (barrel curation), curate subpaths for the 9 externally-consumed symbols and the 6 bins.                                           |
| CI-G-H-2 | `node:` prefix inconsistency in **7 files** (Phase 2 said 6 — `detect-changes.ts:35-36` mixes adjacent styles) | Sweep `from 'fs'` → `from 'node:fs'`.                                                                                                                              |
| CI-G-H-3 | Family-wide `vitest.include` pattern normalization                                                             | 3-way split across 5 packages (`tests/steps/**`, `tests/features/**`, `tests/**/*.steps.ts`). Pick one.                                                            |
| CI-G-H-4 | Promote `packed-dangling-baseline-smoke.mjs` to workspace-level `pack-smoke.mjs`                               | Generic smoke: `npm pack --dry-run` + import the resulting `.tgz`'s `main` + each `exports` subpath. Catches core's `./roles` class of bugs across all 5 packages. |
| CI-G-H-5 | Family-wide `typecheck` scope drift — **guard is correct**; core/projection need alignment                     | Resolved in family-wide normalization PR.                                                                                                                          |
| CI-G-H-6 | Tarball composition post-Phase-2 cleanup                                                                       | 583 KB → ~392 KB (46% reduction): `tier-a-baseline` deletion + family-wide `declarationMap`/`sourceMap` disable.                                                   |

## Medium (P2)

### Language / framework (4A)

| #         | Issue                                                                                                                                                                                                                                                                 |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F4A-G-M-1 | 1 `as never` in test fixture (`guard-runtime.steps.ts:78`) — net-new finding. Replace with proper type or remove.                                                                                                                                                     |
| F4A-G-M-2 | `Result<T, E>` discipline at internal boundaries — matches family — preserve.                                                                                                                                                                                         |
| F4A-G-M-3 | No `.extend()`/`.omit()`/`.pick()`/`.partial()`/`.required()` chains anywhere — guard does NOT expose to the family-wide Zod 4 strictness-loss bug. **Preserve by using `z.strictObject({ ...Base.shape, ... })` spread during the upcoming sweep**, not `.extend()`. |
| F4A-G-M-4 | `lint/idea-tier/`, `lint/steps/` subsystems have minimal Zod schemas — opportunity for the same Zod-first sweep as `process-guard/types.ts`.                                                                                                                          |

### CI / DevOps (4B)

| #        | Issue                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| CI-G-M-1 | Tarball: 583 KB / 155 files; 35% sourcemap bytes; 16% `tier-a-baseline.{js,js.map}` (deletion-bound)  | Same family fix as CL-CORE-3.                                                    |
| CI-G-M-2 | Dogfood `pnpm architect:guard --staged` runs in pre-commit context                                    | Document the pre-commit hook integration in the proposed README (DOC-C-GUARD-2). |
| CI-G-M-3 | `publishConfig.provenance: true` declared but no workflow issues attestation (family-wide; core CI-2) | Resolved when publish workflow lands.                                            |

## Low (P3)

| #         | Source | Issue                                                                     |
| --------- | ------ | ------------------------------------------------------------------------- |
| F4A-G-L-1 | 4A     | `import type` usage correct throughout. Preserve.                         |
| F4A-G-L-2 | 4A     | `as const satisfies T` discipline matches family. Preserve.               |
| F4A-G-L-3 | 4A     | No `as unknown as`, no `any`, no `@ts-ignore` — matches family. Preserve. |
| CI-G-L-1  | 4B     | `engines.node: ">=20.0.0"` correct. `.node-version` family-aligned (22).  |

## Zod 4 audit summary (guard-side)

| Site                                                                   | Verdict          | Notes                                                                                                                 |
| ---------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1 `z.strictObject` site (1 file)                                       | **Correct**      | Reference quality where used.                                                                                         |
| 1 `z.object` site (`AntiPatternThresholdsSchema`)                      | **Drift**        | F4A-G-2 / C-GUARD-3 — 3-line fix.                                                                                     |
| 14 hand-written interfaces in `process-guard/types.ts`                 | **Drift**        | C-GUARD-3 sweep.                                                                                                      |
| Zero `.extend()`/`.omit()`/`.pick()`/`.partial()`/`.required()` chains | **Correct**      | Guard does NOT expose to the family-wide Zod 4 strictness-loss bug. Preserve by spread pattern during upcoming sweep. |
| `parseAtBoundary` consumption                                          | **Zero use**     | C-GUARD-4; 3 sites need adoption.                                                                                     |
| `isValidStatusValue` consumption                                       | **Cast instead** | F4A-G-1; depends on one-line core export edit.                                                                        |
| `.brand<>()` declarations                                              | **Zero**         | F4A-G-H-2; family-wide gap.                                                                                           |

## TS strictness audit

| Issue type                                       | Count                                                       |
| ------------------------------------------------ | ----------------------------------------------------------- |
| `noPropertyAccessFromIndexSignature` defeated    | **0**                                                       |
| `noUncheckedIndexedAccess` evaded                | **0**                                                       |
| `Record<string, unknown>` builders               | **0**                                                       |
| Strictness lies (cast after type-guard rejected) | **0** in guard itself (consumes core's at decider.ts:300)   |
| `as ProcessStatusValue` casts on raw input       | **3 sites** (`detect-changes.ts:414,440,452`) — F4A-G-1 fix |
| `as keyof typeof` after `Set.has`                | **0** in guard (different from projection's M-PROJ-F-4)     |
| `as never`                                       | **1** (`guard-runtime.steps.ts:78`, test only)              |
| `as unknown as X`                                | **0**                                                       |
| `any`                                            | **0**                                                       |

## CI/DevOps audit summary

| Concern                          | Status                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| `prepack` placement              | **Correct** (Phase 1 confirmed).                                                                  |
| `prepack` command                | `pnpm clean && pnpm build` — aligned with siblings.                                               |
| `lint` glob                      | `eslint src tests` — aligned.                                                                     |
| **`typecheck` scope**            | **Most disciplined in family** (covers both configs).                                             |
| `test` chain                     | `pnpm typecheck && vitest run` — aligned with discipline.                                         |
| `eslint` in devDeps              | Explicit — aligned.                                                                               |
| `package.json#exports`           | Only `.` + `./package.json` — sparse, curate after Phase 2.                                       |
| Custom build script              | `scripts/copy-dangling-baseline.mjs` — robust, model for `tier-a-baseline` migration.             |
| Post-pack smoke test             | `scripts/packed-dangling-baseline-smoke.mjs` — **implemented + unwired**; one-line fix activates. |
| Tarball                          | 583 KB / 155 files; projected 46% reduction post-cleanup.                                         |
| Module-load side effects         | **None**.                                                                                         |
| `publishConfig.provenance: true` | Declared, unimplemented (family blocker).                                                         |
| CI workflows                     | **None at repo level** — family gap.                                                              |

## What's family-reference quality (preserve)

[4A] flagged:

1. **`lint/dangling-baseline.ts:7-15`** — the one file in guard that meets projection-reference standard. **Literally the template for the Phase 2 `tier-a-baseline` refactor.**
2. **`vitest-cucumber` harness shape** in `tests/steps/guard-runtime.steps.ts:50-62` — temp-dir tracking + `AfterEachScenario` reset done correctly.
3. **Zero `.extend()`/`.omit()`/`.pick()` chains** — guard avoids the family-wide Zod 4 strictness-loss bug. Preserve by using spread pattern during the upcoming `z.strictObject` sweep.
4. **`Result<T, E>` discipline** at internal boundaries — matches family.

[4B] flagged:

5. **`typecheck` posture** is family-best discipline (covers both configs).
6. **`prepack` + `clean` + custom build script** chain — projection-reference shape.
7. **`scripts/copy-dangling-baseline.mjs`** is robust; serves as the model for the `tier-a-baseline` migration.
8. **`packed-dangling-baseline-smoke.mjs`** is excellent infrastructure; needs wire-up + workspace promotion.

## Recommended landing order (Phase 4 angle)

1. **F4A-G-1** (one-line core edit) — export `isValidStatusValue` + `StatusValueSchema`. **Unblocks 3 guard cast sites + 3 projection `Set.has` sites simultaneously.** Highest cross-package leverage in the review.
2. **CI-G-C-1** (one-line `prepack` wire-up) — activates the smoke test before every publish.
3. **CI-G-C-2 / DOC-H-GUARD-1** — change `git/` `@architect-bounded-context:generator` → `:process-guard`. Independent of Phase 2 demote decision.
4. **F4A-G-2 / C-GUARD-3** — `AntiPatternThresholdsSchema` → strict + `parse({})` for defaults.
5. **F4A-G-H-1** — Zod-first sweep of `process-guard/types.ts` (14 interfaces → `z.infer`).
6. **Phase 2 Sweep 4** — `tier-a-baseline.ts` migration to JSON + Zod schema (full recipe in Phase 2 02-simplification-cleanup.md, uses `dangling-baseline.ts` as template per F4A "what's reference quality").
7. **Phase 2 Sweep 1-2** — `src/index.ts` barrel curation (94% dead surface).
8. **F4A-G-H-3** — CLI argv Zod-first sweep (4 bins, ~360 LOC → Zod argv schemas + `z.coerce.number()`).
9. **F4A-G-H-2 + F4A-G-H-5** — adopt core's brands in `git/`; ban `void main()` via `no-restricted-syntax` ESLint rule.
10. **CI-G-H-4** — promote `packed-dangling-baseline-smoke.mjs` to workspace-level `pack-smoke.mjs`. Family-wide.
11. **CI-G-H-6 + CL-CORE-3** — family-wide tsconfig + sourcemap disable.

## Critical context for Phase 5

- **F4A-G-1's one-line core edit is the single highest-leverage change in the entire review.** Master report should call this out prominently. Unblocks C-CORE-5, C-GUARD-1, and M-PROJ-F-4 at once.
- **Total cost of guard's full doctrine compliance is ~+200 net LOC.** Achievable in one or two PRs once the core export lands.
- **Guard does NOT have the family-wide Zod 4 strictness-loss exposure** (zero `.extend()`/`.omit()`/etc. chains). The Phase 4 reference projection found in `pattern-summary.ts`/`pattern-detail.ts`/`supporting.ts` does not recur here.
- **`dangling-baseline.ts:7-15` is the projection-reference-quality template** for the `tier-a-baseline` migration. The recipe is already in the codebase; just needs application.
- **`packed-dangling-baseline-smoke.mjs` workspace-level promotion** is the local-CI complement to projection's perf-gate wire-up. Both are 1-line fixes today; both should land before the family adds GitHub Actions.
