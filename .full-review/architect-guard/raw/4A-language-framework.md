# architect-guard — Phase 4A: Language & Framework Best Practices

**Stack:** Node 20 / TS 5.8 / Zod 4.1.11 / Vitest 4 / pure ESM. `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, `exactOptionalPropertyTypes` all on (verified `tsconfig.base.json:16,20,23` + `tsconfig.architect-base.json:5`).

## Executive Summary

Guard is the family's **worst doctrine adherence in the package whose job is to enforce doctrine**. Against the projection reference: projection has **107 `z.strictObject` / 0 open `z.object`** with zero hand-written interfaces shadowing schemas; guard has **1 strict / 1 open** (`dangling-baseline.ts:7` vs `validation/types.ts:81`) plus **22 hand-written interfaces across 4 module-types files** (`lint/process-guard/types.ts`, `validation/types.ts`, `lint/steps/types.ts`, `lint/idea-tier/types.ts`, `git/name-status.ts`). The Phase 4A angle: guard's TS posture is in roughly the same shape as core's was at the start of core's Phase 4A — the language idioms the family already uses (Zod 4 strict, `z.infer`, `parseAtBoundary`, branded types, `z.discriminatedUnion`, `BoundaryParseError`) are simply absent from guard, except in the one `dangling-baseline.ts` file. The Phase 4 reframe is concrete: guard needs to adopt projection's idiom set wholesale; this is what "follow your own doctrine" reduces to mechanically.

Three findings are net-new beyond Phases 1–3:

1. **The FSM cast collapse is blocked on one missing core export.** Phase 3 said "land in same PR as core TD-CORE-3"; the actual blocker is more specific. `isValidStatusValue` exists at `architect-core/src/validation/fsm/validator.ts:52` as a **non-exported local function**; FSM barrel `architect-core/src/validation/fsm/index.ts:1-32` does not re-export it; root barrel `architect-core/src/index.ts` does not either. Guard's 3 casts at `detect-changes.ts:414,440,452` cannot be replaced with `parseAtBoundary(StatusValueSchema, ...)` until either (a) core exports `isValidStatusValue` as `isValidProcessStatus`, or (b) core's existing `domain-enums.ts:26 ProcessStatusSchema = z.enum(PROCESS_STATUS_VALUES)` is re-exported as `StatusValueSchema`. **Both already exist in core; neither is exported.** Family fix: a one-line core barrel change unblocks the family-wide narrowing recipe documented in projection's M-PROJ-F-4 (which Phase 4A-projection found has 3 sites waiting on the same export).

2. **No branded types anywhere in guard.** Zero `.brand<>()` declarations across 38 files (`grep -r ".brand<"` returned zero hits). The `git/` module returns stringly-typed `string[]` for staged/added/deleted files (`name-status.ts:19-23 ParsedGitNameStatus` is `readonly string[] × 3`); `branch-diff.ts:46-59 getChangedFilesList` returns `Result<readonly string[]>`; `sanitizeBranchName(branch: string): string` returns plain `string`. Core's `types/branded.ts:7-12` (called "reference implementation" by core's Phase 4A §6) demonstrates the pattern — `z.string().brand<'PatternId'>()`. Guard could brand `BranchName`, `RelativeRepoPath`, `StagedFile` with ~12 lines and the entire `lint/process-guard/` pipeline gains compile-time confusion-resistance against stringly-typed paths. None exist.

3. **CLI argv parsing is hand-coded `for/switch` in 4 bins (~360 LOC) with zero Zod schemas at the boundary.** `lint-process.ts:73-137`, `lint-patterns.ts:78-144`, `lint-steps.ts:43-108`, `validate-patterns.ts:155-272` each open-code argv parsing into an `interface XCLIConfig`. Threshold values come from `parseInt(nextArg, 10)` + `isNaN(threshold)` (`validate-patterns.ts:222-255`, 4 sites) — the same Zod-3-era pattern core's F4A-M-4 caught (and which is `@typescript-eslint/prefer-number-properties` bait per core's recipe). The architectural defect is bigger than the lexical one: argv is a trust boundary per ADR-009; guard has 4 of them parsing without `parseAtBoundary(ArgvSchema, process.argv.slice(2))`. Projection's `parseAndProject` pattern is the family reference; guard reproduces zero of it.

The four highest-leverage Phase 4 fixes (each cascades):

1. **Core exports `isValidProcessStatus` (one-line core edit) + `StatusValueSchema` (already exists as `ProcessStatusSchema`).** Unlocks guard's `parseAtBoundary` adoption at `detect-changes.ts:414,440,452`, and unlocks projection's M-PROJ-F-4 narrowing at 3 sites. **One core export, four guard+projection cast removals.**
2. **`process-guard/types.ts` Zod-first sweep (Phase 2 §2 confirmed by 4A).** 14 interfaces → `z.infer<typeof Schema>` against `z.strictObject`. Mirrors core's F4A-H-3 recipe applied to projection. The blocker is none — projection's `extracted-shape.ts:81-82` `z.input`/`z.infer` template applies directly.
3. **`AntiPatternThresholdsSchema` `z.object` → `z.strictObject` + `DEFAULT_THRESHOLDS = AntiPatternThresholdsSchema.parse({})`** at `validation/types.ts:81-99`. One file, 18 lines deleted, 1 line added. Eliminates the schema-vs-data parallel maintenance flagged Phase 2 Cleanup-M-GUARD-1.
4. **Brand `BranchName` + `RelativeRepoPath` in core + adopt across guard's `git/` and `lint/process-guard/`.** ~12 LOC core add; ~30 LOC guard signature changes. `sanitizeBranchName` becomes a parsing brand constructor; the entire process-guard pipeline gains nominal typing against confusion bugs.

## Critical (P0)

### F4A-G-1. FSM cast collapse blocked on one missing core export **[net-new specificity]** (closes C-GUARD-1)

**File:line:** `architect-guard/src/lint/process-guard/detect-changes.ts:414, 440, 452` (consume); `architect-core/src/validation/fsm/validator.ts:52` (the type-guard exists but is not exported); `architect-core/src/validation/fsm/index.ts:1-32` (barrel; missing the export).

**Verified by grep:**

- `architect-core/src/validation/fsm/validator.ts:52: function isValidStatusValue(status: string): status is ProcessStatusValue` — local, non-exported.
- `architect-core/src/domain-enums.ts:26: export const ProcessStatusSchema = z.enum(PROCESS_STATUS_VALUES)` — exported, but not under the `StatusValueSchema` name guard's recipe wants.
- `architect-core/src/index.ts` — no `isValidProcessStatus`/`isValidStatusValue` export.

**Recipe (the actual minimal edit set):**

```ts
// architect-core/src/validation/fsm/validator.ts — change "function" to "export function" on line 52
export function isValidStatusValue(status: string): status is ProcessStatusValue { ... }

// architect-core/src/validation/fsm/index.ts — add to existing export block on lines 20-31
export {
  // ... existing exports
  isValidStatusValue as isValidProcessStatus,
} from './validator.js';

// architect-core/src/index.ts — add to the FSM re-export block
export { isValidProcessStatus, ProcessStatusSchema as StatusValueSchema } from './validation/fsm/index.js';
```

Then in guard:

```ts
// architect-guard/src/lint/process-guard/detect-changes.ts:411-414
// Before: regex capture cast to ProcessStatusValue after .includes() check
const newMatch = statusPattern.exec(line);
if (newMatch?.[1]) {
  const toStatus = newMatch[1].toLowerCase();
  if (PROCESS_STATUS_VALUES.includes(toStatus as ProcessStatusValue)) { /* cast strips type info */

// After:
const newMatch = statusPattern.exec(line);
const candidate = newMatch?.[1]?.toLowerCase();
if (candidate !== undefined && isValidProcessStatus(candidate)) {
  // candidate now narrowed to ProcessStatusValue; no cast
```

Same recipe at line 440 and 452 (where `as ProcessStatusValue` is applied to `toStatusRaw` / `fromStatusRaw`).

**Why this is Critical and Phase 4:** Phase 1 C-GUARD-1 and Phase 3 TC-C-GUARD-1 both say "land with core TD-CORE-3." Phase 4A surfaces the exact mechanical block: **one `function` → `export function` edit + 2 re-export lines in core enables the entire guard-side fix.** Until that core edit lands, guard cannot remove the 3 casts without re-implementing `isValidStatusValue` locally (which would duplicate `PROCESS_STATUS_VALUES` membership logic and defeat the family's single-source-of-truth doctrine).

### F4A-G-2. `validation/types.ts:81` — the only `z.object` in guard plus parallel `DEFAULT_THRESHOLDS` data **[sharpens Cleanup-M-GUARD-1]**

**File:line:** `validation/types.ts:81-99`.

```ts
// :81 — open z.object instead of z.strictObject
export const AntiPatternThresholdsSchema = z.object({
  scenarioBloatThreshold: z.number().int().positive().default(30),
  megaFeatureLineThreshold: z.number().int().positive().default(750),
  magicCommentThreshold: z.number().int().positive().default(5),
});

// :95-99 — hand-written data literal duplicating the schema's defaults
export const DEFAULT_THRESHOLDS: AntiPatternThresholds = {
  scenarioBloatThreshold: 30,
  megaFeatureLineThreshold: 750,
  magicCommentThreshold: 5,
};
```

The fix is family-reference:

```ts
export const AntiPatternThresholdsSchema = z.strictObject({
  scenarioBloatThreshold: z.number().int().positive().default(30),
  megaFeatureLineThreshold: z.number().int().positive().default(750),
  magicCommentThreshold: z.number().int().positive().default(5),
});
export type AntiPatternThresholds = z.infer<typeof AntiPatternThresholdsSchema>;
export const DEFAULT_THRESHOLDS: AntiPatternThresholds = AntiPatternThresholdsSchema.parse({});
```

The `DEFAULT_THRESHOLDS.parse({})` pattern is what core's Phase 4A §1 §2 promotes (and projection uses uniformly). After this lands, **guard has 0 open `z.object` and `tier-a-baseline.json` migration (Phase 2 Sweep 1) brings the strict-schema count up by one more**.

## High (P1)

### F4A-G-H-1. `lint/process-guard/types.ts` — 14 hand-written interfaces, zero `z.infer` **[reaffirms C-GUARD-3 from 4A angle]**

**File:line:** `lint/process-guard/types.ts:48-306` (interfaces `ProcessState`, `FileState`, `SessionState`, `ChangeDetection`, `StatusTagLocation`, `StatusTransition`, `DeliverableChange`, `ProcessViolation`, `ValidationResult`, `ProcessGuardRuleDefinition`, `LintProcessOptions`, `DeciderOptions`, `DeciderInput`, `DeciderOutput`). Zero schemas. Zero `z.strictObject`. Zero `z.infer`.

**Recipe:** projection's `extracted-shape.ts:81-82` template applies directly. For each interface, declare a `z.strictObject` schema, then `type Foo = z.infer<typeof FooSchema>`. The `Map<string, FileState>` (`:50`) and `ReadonlyMap<string, StatusTransition>` (`:117`) fields stay outside the schema (Zod 4 doesn't validate Maps natively at runtime); document them as in-memory views derived from a schema-validated `entries: readonly [string, FileState][]` field if any boundary serialization is needed (none currently exists per Phase 2 grep — these never cross JSON).

### F4A-G-H-2. Zero `.brand<>()` in guard — `git/` returns stringly-typed paths **[net-new]**

**Files:**

- `git/helpers.ts:59 sanitizeBranchName(branch: string): string` — validates regex, returns plain `string`.
- `git/name-status.ts:19-23` — `ParsedGitNameStatus.{modified, added, deleted}: readonly string[]`.
- `git/branch-diff.ts:46-59 getChangedFilesList(...): Result<readonly string[]>`.

These are the package's primary boundary types. None are nominal. Core's `types/branded.ts:7-12` demonstrates the right pattern. **Recipe:**

```ts
// architect-core/src/types/branded.ts — add three brands (~12 LOC)
export const BranchNameSchema = z
  .string()
  .regex(/^[a-zA-Z0-9._\-/]+$/, 'invalid branch')
  .refine((s) => !s.startsWith('-') && !s.includes('..'), 'invalid branch')
  .brand<'BranchName'>();
export type BranchName = z.output<typeof BranchNameSchema>;
export function asBranchName(value: string): BranchName {
  return BranchNameSchema.parse(value);
}
// Similar for RelativeRepoPath, StagedFile.

// architect-guard/src/git/helpers.ts:59 — sanitizeBranchName becomes the brand constructor
export function sanitizeBranchName(branch: string): BranchName {
  return asBranchName(branch);
}

// architect-guard/src/git/branch-diff.ts + name-status.ts — readonly StagedFile[] instead of readonly string[]
```

Compile-time benefit: the entire `lint/process-guard/` pipeline distinguishes "a file path we accept from git" from "an arbitrary string." Concrete bug class closed: passing a CLI `--file` value (untrusted) where the call site expects a git-validated path (currently undetectable; the parameter is `string`).

### F4A-G-H-3. 4 CLI bins parse argv by hand without Zod **[net-new on architectural framing]**

**Files (~360 LOC total):**

- `cli/lint-process.ts:73-137` (`parseArgs` returning hand-rolled `ProcessGuardCLIConfig`).
- `cli/lint-patterns.ts:78-144`.
- `cli/lint-steps.ts:43-108`.
- `cli/validate-patterns.ts:155-272`.

The trust-boundary doctrine (ADR-009) says argv is a parse boundary; projection's `parseAndProject` + `parseAtBoundary` is the family reference. Guard reproduces zero of it. **Recipe (per bin):**

```ts
// Define a strict argv schema next to the bin
const LintProcessArgvSchema = z.strictObject({
  mode: z.enum(['staged', 'all', 'files']).default('staged'),
  files: z.array(z.string()).default([]),
  strict: z.boolean().default(false),
  ignoreSession: z.boolean().default(false),
  showState: z.boolean().default(false),
  baseDir: z.string().default(() => process.cwd()),
  format: z.enum(['pretty', 'json']).default('pretty'),
  help: z.boolean().default(false),
  version: z.boolean().default(false),
});
type LintProcessArgv = z.infer<typeof LintProcessArgvSchema>;

// Convert the argv array to an object via the existing for-loop (kept; it's a tokenizer not a validator)
// then parse:
const parsed = parseAtBoundary(LintProcessArgvSchema, argvObject, 'lint-process-argv');
```

The hand-rolled `interface XCLIConfig` types at each bin become `z.infer<typeof XArgvSchema>` via `z.infer`. Errors get `BoundaryParseError` with `BoundaryParseIssue[]` shape (projection's family-reference primitive at `validation/boundary.ts:38-65`).

**Bonus:** `validate-patterns.ts:222-255` `parseInt + isNaN` pattern (4 sites) for `--phase`, `--scenario-bloat-threshold`, `--mega-feature-line-threshold`, `--magic-comment-threshold` disappears — `z.coerce.number().int().positive()` handles it at the schema layer. Same recipe as core F4A-M-4 (`Number.parseInt` + `Number.isNaN`); the Zod-side fix is strictly better than the lexical fix.

### F4A-G-H-4. `process.argv.slice(2)` default + `process.argv = [...]` reassignment pattern repeated 4× **[net-new]**

**File:line:** `lint-process.ts:391-393`, `lint-patterns.ts:389-391`, `lint-steps.ts:223-225`, `validate-patterns.ts:923-927`. Each `runXCli` function reassigns `process.argv` before delegating to `main()`. This is the same mutability hazard core's Phase 4 didn't catch because core has no CLI bins. The reassignment exists because `main()` reads `process.argv.slice(2)` rather than accepting argv as a parameter.

**Recipe:** propagate `argv` through `main(argv)` rather than mutating the global. Once F4A-G-H-3 lands and `parseArgs(argv)` becomes `parseArgvSchema(argv)`, the `process.argv = [...]` lines (12 total LOC across 4 bins) are dead and can be deleted. Pure cleanup; closes a small but real soft-suppression-style hazard.

### F4A-G-H-5. `void main()` × 4 evades the local no-suppressions rule **[reaffirms with concrete count]**

**File:line:** `cli/lint-process.ts:397`, `cli/lint-patterns.ts:395`, `cli/validate-patterns.ts:931`, plus the `void main().catch(...)` variant. Plus `void main()` in non-CLI: `cli/lint-steps.ts` (not applicable — `main()` returns `void`, not `Promise<void>`). Net 3 sites with `void main()` on an async invocation.

Same hazard core F4A-H-9 caught (3 sites in core's `doc-extractor.ts` / `gherkin-extractor.ts`). The local `architect-local/no-suppression-comments` rule (`eslint.config.mjs:13-21`) matches comments only, not `UnaryExpression[operator="void"]`. Core's recipe — add a `no-restricted-syntax` ESLint rule banning `ExpressionStatement > UnaryExpression[operator="void"]` in `src/**/*.ts` — would catch all 3 in guard automatically when it lands family-wide.

A real fix at each site: `main().catch((err) => { handleCliError(err); })` — surfaces unhandled rejection rather than swallowing the floating promise.

### F4A-G-H-6. Hand-written types in 3 additional locations beyond `process-guard/types.ts` **[net-new specificity]**

- `validation/types.ts:50-53 WithTagRegistry`, `:69-74 AntiPatternId` (union of literals; could be `z.enum`), `:107-120 AntiPatternViolation`, `:129-144 DoDValidationResult`, `:151-160 DoDValidationSummary`.
- `lint/steps/types.ts:12-29 StepLintRule`, `FeatureStepPair`. The `STEP_LINT_RULES` const (`:32-117`) uses `as const satisfies Record<string, StepLintRule>` correctly — preserve.
- `lint/idea-tier/types.ts:3-8 IdeaTierLintRule`. The `IDEA_TIER_LINT_RULES` const (`:9-40`) uses `as const satisfies Record<...>` correctly — preserve.

The `as const satisfies` literal-tables (`steps/types.ts:117`, `idea-tier/types.ts:40`) are doctrine-correct (core Phase 4A §6); preserve them. The plain interfaces in `validation/types.ts` and the `FeatureStepPair`/`StepLintRule` shapes are candidates for `z.infer<typeof Schema>` derivation since they cross between modules and at least `WithTagRegistry` is reused widely.

### F4A-G-H-7. `lint-process.ts:170` emits **phantom PDR-005** in user-visible CLI help **[reaffirms DOC-C-GUARD-1 from TS angle]**

**File:line:** `cli/lint-process.ts:170`:

```ts
error    invalid-status-transition  Status transition must follow PDR-005 FSM
```

The Phase 4 angle: this is a load-bearing magic string. The literal `'PDR-005 FSM'` could be a constant exported from the FSM module so the citation lives at a single source of truth (and disappears coherently when Phase 2 Sweep 5 strips the 11 references). Currently it is a free-text fragment inside a CLI help heredoc, which is exactly why Phase 3B caught it; an audit-script extension can't reach it without grepping. Same observation applies to `decider.ts:33,58` and `process-guard/types.ts:29`. If PDR-005 is authored (the recommended outcome per Phase 2 §6), export the FSM module a `PDR_005_REFERENCE: 'PDR-005 FSM'` const; if stripped, the strings disappear by deletion.

## Medium (P2)

### `node:` prefix inconsistency in 6 files **[reaffirms Cleanup-M-GUARD-2 with file list]**

Files using bare `from 'fs'` / `from 'path'` / `from 'child_process'`:

| File                                      | Bare imports                                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `lint/process-guard/detect-changes.ts:36` | `import * as path from 'path'` (NB: `:35` uses `import * as fs from 'node:fs'` — same file mixes both styles) |
| `lint/process-guard/derive-state.ts:30`   | `import * as path from 'path'`                                                                                |
| `lint/steps/pair-resolver.ts:6-7`         | `from 'fs'` + `from 'path'`                                                                                   |
| `lint/steps/runner.ts:8`                  | `from 'fs'`                                                                                                   |
| `lint/idea-tier/runner.ts:7`              | `from 'fs'`                                                                                                   |
| `validation/anti-patterns.ts:33`          | `from 'fs'`                                                                                                   |
| `git/helpers.ts:19`                       | `from 'child_process'`                                                                                        |

`cli/shared.ts:1-3`, `lint/dangling-baseline.ts:1-2`, `lint/tier-a-baseline.ts:1-2`, `lint/process-guard/session-state-reader.ts:26` use `node:` correctly. Mechanical sweep; no behavior change. Core's Phase 4A F4A-L-1 noted the same family pattern.

### `parseInt` + `isNaN` × 5 **[reaffirms with concrete sites]**

- `lint/process-guard/detect-changes.ts:368` — `parseInt(hunkMatch[1], 10)`. Input is a regex capture from a hunk header (already validated by regex shape); `Number.parseInt` is a strict-lint upgrade.
- `cli/validate-patterns.ts:222-255` — 4 sites: `parseInt(nextArg, 10)` + `isNaN(threshold)`. `Number.parseInt` + `Number.isNaN` is the doctrine fix; `z.coerce.number().int().positive()` at the Zod schema level (F4A-G-H-3) is the architectural fix.

### `tests/steps/guard-runtime.steps.ts:78` — `as never` in test fixture **[net-new]**

```ts
state.dodResult = validateDoDForPhase('ExamplePattern', 9, {
  /* shape with deliverable + scenarios */
} as never);
```

`as never` is a TS escape hatch typically used when the call signature has been narrowed beyond what the fixture wants to express. The harness file (`tests/steps/hierarchy-parent-level-mismatch.steps.ts`) doesn't use it. **Recipe:** either define a fixture-builder helper that produces the correct `Phase` input type, or expose a `Phase` schema fixture from the production module so the test imports a strict shape rather than asserting one. The pattern weakens the test's coverage signal — Phase 3A flagged the test surface as "structurally correct but applied to too few scenarios"; this cast is a small additional weakness in what's being applied.

### `Map.get(...)` + `?? defaults` is fine; **`Set.has` narrowing not blocking guard** **[verification]**

Unlike projection's M-PROJ-F-4 (which has 3 `Set.has` narrowing limits waiting on a core `isProcessStatusValue` export), guard's `Set` and `Map` usage is structurally clean. The `VALID_ACCEPTED_STATUS_SET.has(directive.status.toLowerCase())` at `lint/rules.ts:191` is a discard-the-result check (doesn't need to narrow `status` afterward); `knownPatterns.has(target)` at `:374,389,439` doesn't need narrowing either. Guard's narrowing gap is in the `PROCESS_STATUS_VALUES.includes(toStatus as ProcessStatusValue)` pattern at `detect-changes.ts:414` — same library-design limit, but the fix is `isValidProcessStatus(candidate)` per F4A-G-1 rather than a brand on the Set element type.

### `interface ParsedGitNameStatus` shape duplicates the structure of `ChangeDetection`'s file lists **[net-new]**

`git/name-status.ts:19-23` returns `{ modified, added, deleted: readonly string[] }`. `lint/process-guard/types.ts:109-120 ChangeDetection` carries the same 3 lists with the same names plus `statusTransitions` and `deliverableChanges`. After the F4A-G-H-2 brand recipe lands, both should use `readonly StagedFile[]` for those 3 fields uniformly. The duplicated shape is a smell that the `git/` module's return type and the `ChangeDetection` type should share the file-list base (one strict schema, `.pick({ modified: true, added: true, deleted: true })` derives the `ParsedGitNameStatus` shape).

## Low (P3)

- `lint/dangling-baseline.ts:102` — `const parsed = JSON.parse(content) as unknown` then `.parse(parsed)`. The intermediate `as unknown` is unnecessary (`JSON.parse` returns `any` which is structurally `unknown`-compatible when fed to `.parse()`). The same call could be `DanglingBaselineSchema.parse(JSON.parse(content))`. Cosmetic, no behavior change.
- `lint/dangling-baseline.ts:32 DANGLING_BASELINE_SOURCE_PATH = 'packages/architect-guard/src/lint/dangling-baseline.json'` — a hardcoded in-repo path shipping as a public constant (mini-version of C-GUARD-2's tier-a-baseline issue, much smaller). Not a 4A finding per se; flagged for cross-reference.
- `validation/types.ts:165-173 getPhaseStatusEmoji` — emits emoji codepoints (`✅`, `🚧`, `📋`) directly in source. Acceptable in Node; flag only if `process.stdout` encoding is ever non-UTF-8 (not currently a concern).
- Zod 4 deprecations (`@typescript-eslint/no-deprecated: warn` per `eslint.config.mjs:331`): **zero `z.function()` sites**, **zero `.extend()`/`.omit()`/`.pick()`/`.partial()`/`.required()` sites**. Guard does not expose to the projection family-wide strictness-loss bug (Phase 1 C-PROJ-1 / core F4A-H-6). **Preserve this status by NOT introducing `.extend()` during the Zod-first sweep.**

## Zod 4 audit (call-site verdicts)

| Site                                                      | API                                           | Verdict                                                          |
| --------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| `lint/dangling-baseline.ts:7 DanglingBaselineEntrySchema` | `z.strictObject({ pattern, field, missing })` | **Correct** — reference-quality for guard's own contracts.       |
| `lint/dangling-baseline.ts:13`                            | `z.array(...).readonly()`                     | **Correct** — preserve.                                          |
| `lint/dangling-baseline.ts:15`                            | `z.infer<typeof DanglingBaselineEntrySchema>` | **Correct** — sole `z.infer` site in guard.                      |
| `validation/types.ts:81 AntiPatternThresholdsSchema`      | `z.object({ ... })`                           | **Drift** — open at runtime. F4A-G-2 fix.                        |
| `validation/types.ts:90`                                  | `z.infer<typeof AntiPatternThresholdsSchema>` | **Correct (mechanically)** — but derives from an open schema.    |
| `validation/types.ts:95-99 DEFAULT_THRESHOLDS` literal    | hand-written object                           | **Drift** — should be `.parse({})`. F4A-G-2 fix.                 |
| Everywhere else                                           | (no schemas)                                  | **Absent** — guard has only 2 schemas total; projection has 107. |

**Zod 4 idioms not used in guard:** `z.strictObject` (except 1 site), `z.discriminatedUnion`, `z.brand`, `z.input`, `z.output`, `z.prettifyError`, `parseAtBoundary`, `BoundaryParseError`, `z.ZodType<T>: z.lazy(...)`, `z.coerce.number()`. Compare to projection's 7 family-reference patterns (`raw/4A-language-framework.md:178-188`); guard uses zero of them.

## TS strictness audit

| Issue type                                                      | Count | Sites                                                                                                                                               |
| --------------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `as ProcessStatusValue` after `.includes()` / on regex captures | 3     | `detect-changes.ts:414,440,452` (C-GUARD-1)                                                                                                         |
| `as unknown`                                                    | 1     | `dangling-baseline.ts:102` (cosmetic)                                                                                                               |
| `as never`                                                      | 1     | `tests/steps/guard-runtime.steps.ts:78` (test fixture; F4A-G-H-6 / Medium)                                                                          |
| `as any`                                                        | **0** | clean                                                                                                                                               |
| `@ts-ignore`/`@ts-expect-error`/`eslint-disable`                | **0** | clean (matches family)                                                                                                                              |
| `void <async-call>` expressions evading no-suppressions         | 3     | `lint-process.ts:397`, `lint-patterns.ts:395`, `validate-patterns.ts:931` (F4A-G-H-5)                                                               |
| `Map<string, unknown>` builders                                 | **0** | clean (unlike core F4A-H-1 16 sites)                                                                                                                |
| `Record<string, unknown>` builders                              | **0** | clean                                                                                                                                               |
| `[key: string]: unknown` index signature                        | **0** | clean                                                                                                                                               |
| `process.argv` mutation                                         | 4     | `runXCli` functions across all 4 bins (F4A-G-H-4)                                                                                                   |
| `parseInt` + `isNaN` instead of `Number.*`                      | 5     | F4A-G-H-3 / Medium                                                                                                                                  |
| Hand-written interfaces shadowing absent schemas                | 22    | F4A-G-H-1 (14 in `process-guard/types.ts`) + 8 across `validation/types.ts`, `lint/steps/types.ts`, `lint/idea-tier/types.ts`, `git/name-status.ts` |
| Branded types (`.brand<>`)                                      | **0** | F4A-G-H-2                                                                                                                                           |

The strictness flags are on; guard doesn't actively defeat them by way of `Map<string, unknown>` or `Record<string, unknown>` or index signatures (core F4A's three biggest categories). **Guard's strictness defeats are concentrated at the FSM boundary (3 casts) and at the absence of schemas (22 hand-written shapes that should be `z.infer`).** This is structurally different from core's "we have schemas but they're open" and projection's "everything is correct except 2 chained-strict slips."

## What's already idiomatic (preserve)

1. **`lint/dangling-baseline.ts:7-15`** — `z.strictObject` + `.readonly()` + `z.infer`. The single file in guard that meets the family reference standard. **The recipe for `tier-a-baseline.ts` (Phase 2 Sweep 1) is literally to copy this file's shape.** Preserve verbatim.
2. **`as const satisfies T` at `lint/steps/types.ts:117`, `lint/idea-tier/types.ts:40`** — TS 5 idiom correctly applied to literal-tables. Preserve.
3. **Zero `as unknown as`, zero `any`, zero `@ts-ignore`** — guard matches the family on suppression discipline. Phase 1 noted this; Phase 4 confirms by exhaustive grep across all 38 files.
4. **No Zod 4 `.extend()`/`.omit()`/`.pick()`/`.partial()`/`.required()` chains anywhere** — guard does not expose to the family-wide strictness-loss bug (Phase 1 C-PROJ-1). Notable because this is the bug class projection had to discover late. **Preserve by NOT introducing these methods during the Zod-first sweep; use `z.strictObject({ ...BaseSchema.shape, ... })` spread instead.**
5. **`Result<T, E>` discipline at internal boundaries** — `derive-state.ts`, `detect-changes.ts`, `branch-diff.ts`, `dangling-baseline.ts` (async variant) consistently use `Result.ok`/`Result.err` rather than throw-and-catch. This matches core's pattern and is reference-quality for the family.
6. **`vitest-cucumber` harness shape** — `tests/steps/guard-runtime.steps.ts:50-62` does the textbook temp-dir tracking + `AfterEachScenario` cleanup + `createState()` reset. Phase 3A already called this out as structurally correct; Phase 4 confirms from the TS angle (no `let state: any`; `interface GuardRuntimeState` is explicit; `state = createState()` resets cleanly). **Preserve as the template for the FSM-transition tests Phase 3 TC-C-GUARD-1 recommends adding.**
7. **CLI error handling**: `cli/shared.ts:24-35 handleCliError(error: unknown, exitCode = 1): never` uses `error instanceof Error` narrowing + the `never` return type to model the process exit. Correct TS posture; preserve.
8. **`sideEffects: false` in `package.json`** — preserves tree-shakeability; matches family. The 12 wildcards in `src/index.ts` (Cleanup-H-GUARD-1) don't currently cause side-effect leakage because the modules themselves are side-effect-free.

## Cross-package implications for Phase 5

1. **One core export blocks 4 fixes across guard + projection.** Adding `export { isValidStatusValue as isValidProcessStatus }` to core's FSM barrel (and re-exporting `ProcessStatusSchema as StatusValueSchema` from `domain-enums.ts`) unblocks (a) guard's 3 FSM casts at `detect-changes.ts:414,440,452`, (b) projection's 3 `Set.has` narrowing sites at `session-context.internal.ts:264` / `render-compact-text.ts:454` / `scope-readiness.internal.ts:164` per Phase 4A-projection M-PROJ-F-4, and (c) the guard `parseAtBoundary` adoption at the same 3 sites. **Master report should flag this as the single highest-leverage core edit.**
2. **Guard adopts projection's idiom set wholesale.** Phase 4 angle: there's no Zod 4 or TS 5 idiom guard needs to invent; all 8 patterns called out as projection family-reference (4A-projection §"What's family-reference quality") apply directly. The mechanical sweep can use projection's files as templates. Concretely: `_shared/parse-and-project.internal.ts` template → guard's 4 CLI bins; `extracted-shape.ts:81-82` template → `process-guard/types.ts`; `boundary.ts:38-65 BoundaryParseError` → guard's 4 CLI argv error paths.
3. **Branded types are a family-wide gap, not just guard's.** Core has 6 branded types in `types/branded.ts`; projection consumes them; guard ships zero. The `BranchName` / `StagedFile` / `RelativeRepoPath` brands belong in core (they are git domain primitives, not guard's). One core PR adds them; guard's `git/` module adopts them. Family-wide normalization.
4. **CLI argv schemas are a cross-CLI opportunity.** `architect-cli` will face the same gap when Phase 4 lands there. The Zod argv schema pattern + `parseAtBoundary` adoption should be a family-wide CLI convention; document in master report.
5. **The Phase 4 + Phase 2 + Phase 1 combined picture for guard.** Sweeps land in order: (1) core exports `isValidProcessStatus`; (2) guard removes 3 FSM casts; (3) `process-guard/types.ts` Zod-first sweep (14 interfaces); (4) `AntiPatternThresholdsSchema` strict + `.parse({})`; (5) branded `BranchName`/`StagedFile` in core; (6) guard's `git/` adopts brands; (7) 4 CLI argv schemas; (8) `node:` prefix sweep (6 files); (9) `parseInt`/`isNaN` → `Number.*` or `z.coerce.number()`; (10) `void main()` → `main().catch(handleCliError)` × 3. **Total ~250 LOC of additions, ~80 LOC of deletions, ~30 LOC of edits — net ~+200 LOC for full doctrine compliance in the package whose job is to enforce doctrine.**
