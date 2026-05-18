# architect-guard — Phase 1 Consolidated: Code Quality & Architecture

**Sources:** `raw/1A-code-quality.md` + `raw/1B-architecture.md`. Findings tagged **[1A]**, **[1B]**, or **[1A+1B]**.

## Executive Summary

`architect-guard` sits **between core and projection on the doctrine spectrum — closer to core**. The package whose anti-pattern detector enforces doctrine on siblings is itself the second-most doctrine-inconsistent in the family. Headline numbers: **1 `z.strictObject` site vs 1 open `z.object`** (projection: 107/0); **55% `@architect-pattern` annotation rate** (projection 60%, core 26%); **zero suppressions in src/** (good — matches family); **only 3 test feature files / 5 step files for 9,135 SLOC** — the family's worst test-to-source ratio; no projection-style audit scripts.

The Critical findings reveal **a single cross-package contract failure made worse on both sides**:

1. **The FSM trust-boundary collapse spans core AND guard.** Core's `validateTransition` (C-CORE-5) casts strings to `ProcessStatusValue` after `isValidStatusValue` rejected them. Guard's consumer at `decider.ts:300` is the only production caller of `validateTransition` in the workspace — AND it adds **three additional `as ProcessStatusValue` casts at `detect-changes.ts:414, 440, 452`** stripping raw regex captures of git diff text directly into the branded FSM state type. No `parseAtBoundary` at the git-diff input boundary. Zero FSM-transition tests on either side. Garbage status values can reach `getValidTransitionsFrom`, returning `undefined`, and then `.join(', ')` throws `TypeError`. Both packages defer FSM-validity testing to "the other side"; `process-guard-rules.feature:43-48` even cites a "phase-state-machine feature suite" that doesn't exist in either package.

2. **`tier-a-baseline.ts` is the family's worst dogfood leakage** — 1,040 lines of hardcoded in-repo file paths (`packages/architect-cli/...`, `packages/architect-mcp/...`, `packages/architect-core/...`, `packages/architect-projection/...`, `packages/architect-guard/...`) shipping through the public barrel as `TIER_A_LINT_BASELINE`. A consumer of `@libar-dev/architect-guard` cannot clear or override this baseline. **Worse than core's H-CORE-10 `self-hosting.ts`** (which is at least 95 lines, gated by suffix check, and didn't ship as a barrel constant). The neighbor file `dangling-baseline.ts` solves the same class of problem cleanly via JSON + Zod schema + build-time copy from `architect/dangling-baseline.json` — the right shape is in the same directory.

3. **The package whose anti-pattern detector enforces doctrine doesn't follow it in its own contracts.** `lint/process-guard/types.ts` has 14 hand-written interfaces, zero `z.infer`, no `z.strictObject` anywhere in `process-guard/`. `AntiPatternThresholdsSchema` is open `z.object` with hand-written `DEFAULT_THRESHOLDS` data parallel to the schema (drift waiting to happen). The `@architect-pattern` annotation rate inside `process-guard/` is below the package average.

4. **`parseAtBoundary` from core is never used in guard** despite three input boundaries: CLI argv (the bins), git diff text (regex captures), `dangling-baseline.json` (file read). `dangling-baseline.ts:102` reads + parses without `parseAtBoundary`, the same pattern projection's C-PROJ-2 outlier got dinged for. Core's TD-CORE-1 noted `parseAtBoundary` is invisible from every angle in core; guard reproduces the same invisibility.

5. **Phantom ADR reference.** Guard's source cites "PDR-005 FSM" throughout but **no such record exists in `architect/decisions/`**. PDR-001 (cited in family docs) governs `scope-validate`/`handoff` which live in `architect-cli`, not guard.

Cross-package implications: **`validateCompletionMetadata` deletion in core will create a gap in guard's DoD checker** — Phase 1A confirms guard does NOT have an equivalent "completed pattern must have @architect-completed date" check. Phase 1A also confirmed: no 5th `buildRoleLookup` copy (H-CORE-13 — healthy), no `fuzzy-match`/`extractFirstSentenceRaw` duplication (CL-CORE-16/17 — healthy), F4A-H-6 (`.extend()` strictness loss) not exposed (only 1 schema, monolithic).

## Critical (P0)

### C-GUARD-1. FSM trust-boundary collapse spans core+guard **[1A+1B]** (compounds core C-CORE-5)

`decider.ts:300` consumes core's lying `validateTransition`. `detect-changes.ts:414, 440, 452` adds three more `as ProcessStatusValue` casts on raw regex captures from git diff text. Zero FSM-transition tests in guard. The result: garbage status values flow from git diff → cast at detect-changes → consumed by decider → reach core's `validateTransition` → return `{ valid: false, from: garbage as ProcessStatusValue }` → `getValidTransitionsFrom(garbage as ProcessStatusValue)` returns `undefined` → `.join(', ')` throws `TypeError`.

**Recipe (closes core C-CORE-5 + this finding in one move):**
- Core exports `isValidProcessStatus(value: unknown): value is ProcessStatusValue` type-guard.
- Guard's `detect-changes.ts` uses `parseAtBoundary(StatusValueSchema, captured)` at all three sites; the casts disappear.
- `decider.ts` uses the discriminated `TransitionValidationResult` (already core's C-CORE-5 recipe); narrowing works correctly.
- Add FSM transition tests in guard (`tests/features/validation/fsm-transitions-via-guard.feature`) AND core (per core's TD-CORE-3). Cover legal/illegal transitions, invalid input, terminal-state rejection.

### C-GUARD-2. `tier-a-baseline.ts` — 1,040 LOC of hardcoded cross-package paths in published barrel **[1B]**

`src/lint/tier-a-baseline.ts` ships `TIER_A_LINT_BASELINE` (1,040 lines of hardcoded in-repo paths) through `src/index.ts`. **No override mechanism**; a consumer can't clear or extend it. Worst dogfood leakage in the family by an order of magnitude.

**Recipe:** follow the `dangling-baseline.ts` shape — JSON file at the repo root + Zod schema + build-time copy + `--baseline` override at the CLI level. Then `tier-a-baseline.ts` becomes ~30 LOC of load + parse logic; the data lives in `architect/tier-a-baseline.json` (dogfood) and consumers point their own CLI at their own baseline.

### C-GUARD-3. The doctrine-enforcing package doesn't follow doctrine in its own contracts **[1A+1B]**

`lint/process-guard/types.ts` has 14 hand-written interfaces; zero `z.infer`; no `z.strictObject` anywhere in `process-guard/`. `AntiPatternThresholdsSchema` is open `z.object` with parallel hand-written `DEFAULT_THRESHOLDS` data. Schema-vs-data drift inevitable.

**Recipe:** sweep `process-guard/types.ts` to derive types from `z.strictObject` schemas via `z.infer`. Make `AntiPatternThresholdsSchema` strict; derive `DEFAULT_THRESHOLDS` from the schema's defaults rather than declaring twice. Match projection's reference quality.

### C-GUARD-4. `parseAtBoundary` never used despite three trust boundaries **[1B]**

CLI argv, git diff text, `dangling-baseline.json`. Same architectural defect as core TD-CORE-1, but in the package whose job is to enforce trust at the doctrine level.

**Recipe:** apply `parseAtBoundary(StatusValueSchema, captured)` at git-diff parse sites; `parseAtBoundary(ArgvSchema, process.argv.slice(2))` at CLI entry; `parseAtBoundary(DanglingBaselineSchema, JSON.parse(content))` at file read. Same recipe as projection's `parseAndProject` adoption (which is the family reference).

## High (P1)

### Architecture (14 — from 1B) + 9 from 1A

| # | Title | Location |
|---|-------|----------|
| H-GUARD-1 | `src/index.ts` 12 `export *` wildcards — public contract is unidentifiable | `src/index.ts` |
| H-GUARD-2 | `validate-patterns.ts` 935 LOC mixing 8 concerns | `src/lint/validate-patterns.ts` |
| H-GUARD-3 | `git/` module annotated `@architect-bounded-context:generator` but lives in guard; **actually consumed by core** | `src/git/` directory |
| H-GUARD-4 | Two different config-loading APIs (`loadConfig` and `loadProjectConfig`) consumed by sibling CLIs — drift bait | `src/cli/`, `src/validation/` |
| H-GUARD-5 | `getDeliverableWorkflowPatterns` belongs in core's `PatternGraphAPI`, not guard's validation | `src/validation/...` |
| H-GUARD-6 | `dangling-baseline.ts` dual-write logic can silently corrupt consumer `node_modules` | `src/lint/dangling-baseline.ts` |
| H-GUARD-7 | `process-guard-rules.feature:43-48` defers FSM-validity testing to a nonexistent feature suite | `tests/features/process-guard-rules.feature` |
| H-GUARD-8 | Phantom PDR-005 reference throughout source | multiple files in `src/lint/process-guard/` |
| H-GUARD-9 | `validateCompletionMetadata` core CL-CORE-5 deletion creates DoD gap; guard has no equivalent | (guard absence; flag for sweep) |
| H-GUARD-10 | `package.json#exports` declares only `.` and `./package.json` — no curated subpaths for the 6 bins | `package.json` |
| H-GUARD-11 | `tier-a-baseline.ts` family-wide structural lock — projection can't land splitting refactors without coordinating with guard | cross-package |
| H-GUARD-12 | Dual `console.*` paths + raw `Error` throws vs typed | multiple files |
| H-GUARD-13 | `dangling-baseline.json` build-time copy fragile | `scripts/copy-dangling-baseline.mjs` |
| H-GUARD-14 | `lint/` has no shared error/diagnostic type across the three sub-modules | `src/lint/*/` |

(9 additional 1A High items overlap heavily with the above — covered in raw.)

## Medium (P2) — abbreviated

Phase 1 found ~23 medium items across 1A and 1B. Key themes:

- `process-guard-rules.feature:43-48` "phantom upstream suite" (M-GUARD-5)
- **3 test feature files for 9,135 SLOC = worst test-to-source ratio in the family** (M-GUARD-12). Compare: core 51 step files/12K SLOC, projection 24 features+steps/15K SLOC.
- `cli/` argv parsing without Zod (CLI argv is a trust boundary; covered in C-GUARD-4)
- `git/` module functions return string-stringly-typed instead of branded types
- `dangling-baseline.ts` returns mutable arrays where readonly would fit
- Several validators duplicate logic that core's `PatternGraphAPI` could expose
- Anti-pattern detector emits diagnostics through `console.log` rather than a structured channel
- `dangling-baseline.ts:102` uses `JSON.parse` without `parseAtBoundary`

## Low (P3) — abbreviated

~10 small items: regex hoisting, error-message capitalization, dead exports, stale comments referring to W7/W1.5 work that's done.

## ADR Conformance

| ADR | Status | Notes |
|-----|--------|-------|
| ADR-009 Projection Trust Boundary | **Violated by omission** | `parseAtBoundary` not used at any of 3 trust boundaries. |
| Phantom "PDR-005 FSM" | **Does not exist** | Cited in guard source but no file in `architect/decisions/`. Either create the PDR or remove the references. |
| PDR-001 Session Workflow Commands | **N/A** | Governs `scope-validate`/`handoff` in `architect-cli`, not guard. |

## What's healthy (preserve)

- Zero suppressions in src — matches family.
- 55% `@architect-pattern` annotation rate — above core's 26%.
- Build pipeline disciplined: `prepack` in scripts, `pnpm clean && pnpm build`, `typecheck` covers both configs.
- Lint script covers `src tests` — aligned with siblings.
- `dangling-baseline.ts` is the right shape for the dogfood-baseline pattern — just needs `tier-a-baseline.ts` to follow it.
- No 5th `buildRoleLookup` copy; no `fuzzy-match`/`extractFirstSentenceRaw` duplication; no F4A-H-6 exposure.
- `dangling-baseline.json` build-time copy mechanism is sound (just fragile to consumer-side absence per H-GUARD-13).

## Cross-package implications for master report

1. **FSM trust-boundary collapse spans core + guard.** One coordinated recipe closes both C-CORE-5 + C-GUARD-1. The fact that **both packages defer testing to "the other side"** is a process finding, not just a code finding — master report should call this out.
2. **`tier-a-baseline.ts` is a family-wide structural lock.** Projection's H-PROJ-A-5 (split `render-markdown.ts`) and similar refactors in any sibling cannot land without guard's baseline being updated in the same PR. Make the baseline external (JSON + override).
3. **`validateCompletionMetadata` deletion in core leaves a gap.** Per core CL-CORE-5, the function is deletion-bound. Guard has no equivalent DoD check. Either preserve the logic in guard before core deletes, or accept the deletion as a feature loss.
4. **The `git/` module is in the wrong package.** Annotated `generator` context, consumed by core, lives in guard. Move to core (or accept the cross-package import as intentional and re-annotate).
5. **Phantom PDR-005 references** — either create the PDR document (probably should — process-guard FSM enforcement is decision-worthy) or remove the references.
6. **Zod 4 `.extend()`/`.omit()` strictness audit family-wide** — guard is NOT exposed (single schema, monolithic), but the family audit script (proposed in projection's Phase 4) should still scan guard.
7. **`parseAtBoundary` is invisible from every angle in core (TD-CORE-1) AND guard (C-GUARD-4).** Projection is the only consumer. The recipe in core's Sweep 26 + guard's C-GUARD-4 lands the family-wide trust-boundary discipline.
8. **The `git/` and `dangling-baseline` machinery should likely move to a `@libar-dev/architect-git` sub-package** — the alternative is to live in core or guard, but neither owner is clean. Worth flagging in master report.
9. **CLI argv as trust boundary** — guard's bins parse `process.argv` without Zod. Same recipe needed in `architect-cli`. Flag for the upcoming CLI review.
10. **Audit scripts** — projection has 2; guard has 0; per core/projection cross-references the family-wide promotion opportunity is real.
11. **Test-to-source ratio worst in family** — Phase 3 will need to flag this prominently.
12. **`process-guard/` is the package's "core competency" and has the worst doctrine adherence** in the package. Suggests a discipline gap on the workflow that ships this code.

## Critical context for Phase 2

The Phase 2 simplification + cleanup agents should focus on:
- The `tier-a-baseline.ts` deletion → JSON+override refactor (single highest-leverage recipe).
- The `process-guard/types.ts` Zod-first sweep (14 interfaces → schemas + `z.infer`).
- The `git/` module re-homing decision.
- The 935-LOC `validate-patterns.ts` split.
- The dual `loadConfig`/`loadProjectConfig` consolidation.
- The `dangling-baseline.ts` consumer-side robustness (H-GUARD-13).
- The "phantom feature suite" reference cleanup at `process-guard-rules.feature:43-48`.
