# architect-guard — Phase 2A Simplification

**Scope:** `packages/architect-guard/src/` (38 files, 9,135 SLOC). Cites Phase 1 IDs from `01-quality-architecture.md` — no re-derivation.

## Executive summary

Five highest-leverage moves account for ~1,400 LOC of deletions / contract-strict conversions and close C-GUARD-1 through C-GUARD-4 plus three High items in one coordinated PR pass. The biggest is **C-GUARD-2** — `tier-a-baseline.ts` is 1,138 LOC of hardcoded cross-package paths shipped through the public barrel; replacing it with the `dangling-baseline.ts` shape (JSON + Zod schema + `--baseline` override) takes the file to ~70 LOC and unlocks the family-wide structural lock (H-GUARD-11). Second-biggest is **C-GUARD-3** — `lint/process-guard/types.ts` (305 LOC, 14 hand-written interfaces, zero `z.infer`) collapses to schema-derived types with `AntiPatternThresholdsSchema` becoming the single source of `DEFAULT_THRESHOLDS`. Three `parseAtBoundary` adoption sites (C-GUARD-4) and three FSM cast sites (C-GUARD-1) share one core export: `isValidProcessStatus`. **`loadConfig` is a 12-line wrapper around `loadProjectConfig`** (H-GUARD-4) — pure deletion. Six remaining medium recipes are listed compactly. Phase 1 already noted what's clean (`dangling-baseline.ts` shape, build-time copy mechanism, zero suppressions, branded type discipline at the FSM boundary on the receiving end) — preserve as-is.

---

## 1. C-GUARD-2 — `tier-a-baseline.ts` 1,138-LOC dogfood-leak → JSON + Zod + CLI override

**File:** `src/lint/tier-a-baseline.ts` (lines 1–1040 are the data table; 1042–1138 are the applier logic).

### Why this is highest-leverage

- Lines 19–1040 (1,022 lines of inline data) ship through `src/index.ts` line 9 (`export * from './lint/index.js'`).
- The data is **specific to the architect monorepo** — every entry path starts with `packages/architect-*/`. No consumer can clear or override it.
- The neighbor file `src/lint/dangling-baseline.ts` (140 LOC) already solves the same problem cleanly. Its build-time copier `scripts/copy-dangling-baseline.mjs` (12 LOC) is already wired into the publish pipeline.

### Before (current shape)

```ts
// src/lint/tier-a-baseline.ts:19 — 1,022 lines of inlined data
export const TIER_A_LINT_BASELINE: readonly TierABaselineEntry[] = [
  { path: 'packages/architect-cli/src/cli/error-handler.ts',
    rule: 'missing-pattern-name', line: 3,
    message: 'Pattern missing explicit name. Add @architect-pattern YourPatternName' },
  // … 1,021 more entries hardcoded …
] as const;

export function applyTierABaseline(summary: LintSummary, options: TierABaselineFilterOptions): LintSummary {
  if (TIER_A_LINT_BASELINE.length === 0) return summary;
  // …
}
```

### After (mirrors `dangling-baseline.ts`)

**File layout:**

```
packages/architect-guard/
├── src/lint/
│   ├── tier-a-baseline.json     (NEW — data lives here)
│   ├── tier-a-baseline.ts       (shrinks to ~70 LOC)
│   ├── dangling-baseline.json   (existing)
│   └── dangling-baseline.ts     (existing — reference shape)
└── scripts/
    └── copy-baselines.mjs       (rename + extend the existing copier)
```

**Zod schema + loader:**

```ts
// src/lint/tier-a-baseline.ts (full replacement, ~70 LOC)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { parseAtBoundary } from '@libar-dev/architect-core';

import type { LintViolation } from '@libar-dev/architect-core';
import type { LintSummary } from './engine.js';
import { summarizeLintResults } from './engine.js'; // move helper here

const TierABaselineEntrySchema = z.strictObject({
  path: z.string(),
  rule: z.string(),
  line: z.number().int().nonnegative(),
  message: z.string(),
});

const TierABaselineSchema = z.array(TierABaselineEntrySchema).readonly();

export type TierABaselineEntry = z.infer<typeof TierABaselineEntrySchema>;

export interface TierABaselineFilterOptions {
  readonly baseDir: string;
  readonly baselinePath?: string; // CLI --baseline override
}

const DEFAULT_BASELINE_FILE_URL = new URL('./tier-a-baseline.json', import.meta.url);
export const TIER_A_BASELINE_SOURCE_PATH =
  'packages/architect-guard/src/lint/tier-a-baseline.json';

export async function readTierABaseline(
  baselinePath?: string,
): Promise<readonly TierABaselineEntry[]> {
  const resolved = baselinePath ?? fileURLToPath(DEFAULT_BASELINE_FILE_URL);
  const content = await fs.readFile(resolved, 'utf8');
  return parseAtBoundary(TierABaselineSchema, JSON.parse(content) as unknown);
  // ^ closes C-GUARD-4 site #3 in the same recipe
}

export async function applyTierABaseline(
  summary: LintSummary,
  options: TierABaselineFilterOptions,
): Promise<LintSummary> {
  const baseline = await readTierABaseline(options.baselinePath);
  if (baseline.length === 0) return summary;

  const repoRoot = findRepoRoot(options.baseDir);
  const baselineKeys = new Set(baseline.map(createBaselineKey));
  const results = summary.results
    .map((r) => ({
      file: r.file,
      violations: r.violations.filter(
        (v) => !baselineKeys.has(createKeyFromViolation(r.file, v, options.baseDir, repoRoot)),
      ),
    }))
    .filter((r) => r.violations.length > 0);

  return summarizeLintResults(results, summary.filesScanned, summary.directivesChecked);
}

// createBaselineKey, createKeyFromViolation, findRepoRoot remain unchanged ~30 LOC.
```

**Build copier (extend the existing one):**

```js
// scripts/copy-baselines.mjs (replaces copy-dangling-baseline.mjs)
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const baselines = ['dangling-baseline.json', 'tier-a-baseline.json'];
for (const name of baselines) {
  const src = fileURLToPath(new URL(`../src/lint/${name}`, import.meta.url));
  const dst = fileURLToPath(new URL(`../dist/lint/${name}`, import.meta.url));
  await mkdir(dirname(dst), { recursive: true });
  await copyFile(src, dst);
}
```

**CLI plumbing — `validate-patterns.ts`:**

```ts
// add to ValidateCLIConfig (line 117):
baselinePath?: string;

// add to parseArgs switch (after line 263):
} else if (arg === '--baseline') {
  const nextArg = argv[++i];
  if (!nextArg) throw new Error(`Missing value for ${arg} flag`);
  config.baselinePath = nextArg;
}

// wire into applyTierABaseline at the call site:
const filtered = await applyTierABaseline(summary, {
  baseDir: config.baseDir,
  ...(config.baselinePath !== undefined ? { baselinePath: config.baselinePath } : {}),
});
```

**Data file (one-time generation):**

```bash
# Regenerate from current TIER_A_LINT_BASELINE constant before deletion:
node -e "import('./src/lint/tier-a-baseline.ts').then(m =>
  process.stdout.write(JSON.stringify(m.TIER_A_LINT_BASELINE, null, 2)))" \
  > src/lint/tier-a-baseline.json
```

### Impact

- 1,138 LOC → ~70 LOC (–1,068 lines).
- Closes C-GUARD-2 (worst dogfood-leak in family).
- Closes C-GUARD-4 site #3 (`parseAtBoundary` on file-read boundary).
- Closes H-GUARD-11 (family-wide structural lock: projection can land splitting refactors without coordinating with guard's hardcoded paths).
- Drops `TIER_A_LINT_BASELINE` from the public barrel (1 entry in `src/index.ts:9` wildcard) — consumers point `--baseline` at their own JSON.

---

## 2. C-GUARD-3 — `process-guard/types.ts` 14 interfaces → `z.infer`

**File:** `src/lint/process-guard/types.ts` (305 LOC, lines 48–305 are the 14 interfaces and type aliases). Zero `z.infer` in the file. `validation/types.ts:81` declares `AntiPatternThresholdsSchema` as **open** `z.object` (not `z.strictObject`) and declares `DEFAULT_THRESHOLDS` as a separate hand-written constant — schema-vs-data drift waiting to happen.

### Before

```ts
// src/lint/process-guard/types.ts:48
export interface ProcessState {
  readonly files: Map<string, FileState>;
  readonly activeSession?: SessionState;
  readonly derivedAt: string;
}
// … 13 more hand-written interfaces …

// src/validation/types.ts:81 — open z.object
export const AntiPatternThresholdsSchema = z.object({
  scenarioBloatThreshold: z.number().int().positive().default(30),
  megaFeatureLineThreshold: z.number().int().positive().default(750),
  magicCommentThreshold: z.number().int().positive().default(5),
});
export type AntiPatternThresholds = z.infer<typeof AntiPatternThresholdsSchema>;

// Hand-written parallel data — drifts silently if defaults change:
export const DEFAULT_THRESHOLDS: AntiPatternThresholds = {
  scenarioBloatThreshold: 30,
  megaFeatureLineThreshold: 750,
  magicCommentThreshold: 5,
};
```

### After

```ts
// src/lint/process-guard/types.ts (sweep — types from schemas)
import { z } from 'zod';
import {
  AcceptedStatusValueSchema,
  NormalizedStatusSchema,
  ProcessStatusValueSchema,
  ProtectionLevelSchema,
  TagRegistrySchema,
} from '@libar-dev/architect-core';

export const FileStateSchema = z.strictObject({
  path: z.string(),
  relativePath: z.string(),
  status: AcceptedStatusValueSchema,
  normalizedStatus: NormalizedStatusSchema,
  protection: ProtectionLevelSchema,
  deliverables: z.array(z.string()).readonly(),
  hasUnlockReason: z.boolean(),
  unlockReason: z.string().optional(),
});
export type FileState = z.infer<typeof FileStateSchema>;

export const SessionStatusSchema = z.enum(['draft', 'active', 'closed']);
export type SessionStatus = z.infer<typeof SessionStatusSchema>;

export const SessionStateSchema = z.strictObject({
  id: z.string(),
  status: SessionStatusSchema,
  scopedSpecs: z.array(z.string()).readonly(),
  excludedSpecs: z.array(z.string()).readonly(),
  sessionFile: z.string(),
});
export type SessionState = z.infer<typeof SessionStateSchema>;

export const ProcessStateSchema = z.strictObject({
  files: z.map(z.string(), FileStateSchema), // Zod 4 Map support
  activeSession: SessionStateSchema.optional(),
  derivedAt: z.string(),
});
export type ProcessState = z.infer<typeof ProcessStateSchema>;

// … repeat for StatusTagLocation, StatusTransition, DeliverableChange,
//    ChangeDetection, ProcessViolation, ValidationResult, DeciderOptions,
//    DeciderInput, DeciderOutput, DeciderEvent, ProcessGuardRule,
//    ProcessGuardRuleDefinition, LintProcessOptions, ValidationMode …
```

```ts
// src/validation/types.ts:81 — strict schema; derive defaults FROM it
export const AntiPatternThresholdsSchema = z.strictObject({
  scenarioBloatThreshold: z.number().int().positive().default(30),
  megaFeatureLineThreshold: z.number().int().positive().default(750),
  magicCommentThreshold: z.number().int().positive().default(5),
});
export type AntiPatternThresholds = z.infer<typeof AntiPatternThresholdsSchema>;

// Single source of truth — defaults flow from the schema:
export const DEFAULT_THRESHOLDS: AntiPatternThresholds = AntiPatternThresholdsSchema.parse({});
```

### Impact

- 305 LOC of hand-written types → ~150 LOC of schemas + `z.infer` (preserves all JSDoc).
- `DEFAULT_THRESHOLDS` drift impossible by construction.
- `validation/types.ts:95-99` hand-written `DEFAULT_THRESHOLDS` object — deleted.
- `process-guard/` annotation rate climbs to package average; closes the "doctrine-enforcing package doesn't follow doctrine" finding.
- Note: `ProcessGuardRule` should stay as `z.enum([...])` (preserves type narrowing on string literals; equivalent to current type union).

---

## 3. C-GUARD-4 + C-GUARD-1 — three `parseAtBoundary` sites + three FSM casts (one core export)

Both findings share one missing primitive: **core needs to export `isValidProcessStatus` (or `StatusValueSchema`).** The recipe is in core C-CORE-5 — guard is the only consumer, so this is one coordinated PR.

### Site 1 + 2 + 3: `detect-changes.ts` 3 casts (C-GUARD-1)

```ts
// Before: src/lint/process-guard/detect-changes.ts:414, 440, 452
if (PROCESS_STATUS_VALUES.includes(toStatus as ProcessStatusValue)) { /* … */ }
// …
const toStatus = toStatusRaw as ProcessStatusValue;
// …
fromStatus = fromStatusRaw ? (fromStatusRaw as ProcessStatusValue) : DEFAULT_STATUS;
```

```ts
// After — core exports `isValidProcessStatus(v: unknown): v is ProcessStatusValue`:
import { isValidProcessStatus } from '@libar-dev/architect-core';

// Line 414 — type guard narrows automatically:
if (isValidProcessStatus(toStatus)) { /* toStatus is ProcessStatusValue */ }

// Line 440 — early-return on parse failure (already pre-filtered upstream, but explicit narrowing):
if (!isValidProcessStatus(toStatusRaw)) continue;
const toStatus = toStatusRaw; // type: ProcessStatusValue, no cast

// Line 452 — same pattern:
fromStatus = isValidProcessStatus(fromStatusRaw) ? fromStatusRaw : DEFAULT_STATUS;
```

Three `as ProcessStatusValue` casts disappear. No cost — `PROCESS_STATUS_VALUES.includes(...)` was already the runtime check; the cast was the type-system evasion.

### Site 4: CLI argv parsing (C-GUARD-4 site #1)

Three CLI files each hand-roll an argv loop with `parseInt(nextArg, 10)` + `isNaN` checks (`validate-patterns.ts:155-271`, `lint-process.ts`, `lint-patterns.ts`, `lint-steps.ts`). Same 7 flags repeat. Recipe: one shared `ValidateCLIArgvSchema` + `parseAtBoundary(ValidateCLIArgvSchema, process.argv.slice(2))`.

```ts
// src/cli/argv-schemas.ts (new file, ~80 LOC for all 4 CLIs)
import { z } from 'zod';

const positiveInt = z.coerce.number().int().positive();

export const ValidateCLIArgvSchema = z.strictObject({
  input: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  exclude: z.array(z.string()).default([]),
  baseDir: z.string().default(() => process.cwd()),
  strict: z.boolean().default(false),
  format: z.enum(['pretty', 'json']).default('pretty'),
  help: z.boolean().default(false),
  dod: z.boolean().default(false),
  phases: z.array(positiveInt).default([]),
  antiPatterns: z.boolean().default(false),
  scenarioBloatThreshold: positiveInt.default(30),
  megaFeatureLineThreshold: positiveInt.default(750),
  magicCommentThreshold: positiveInt.default(5),
  baselinePath: z.string().optional(),
  version: z.boolean().default(false),
  verbose: z.boolean().default(false),
  updateBaseline: z.boolean().default(false),
});

export type ValidateCLIConfig = z.infer<typeof ValidateCLIArgvSchema>;

// parseArgs becomes a thin tokenizer:
export function parseValidateArgs(argv: readonly string[]): ValidateCLIConfig {
  const raw: Record<string, unknown> = {};
  // … existing argv loop, but populates raw object instead of typed config …
  return parseAtBoundary(ValidateCLIArgvSchema, raw); // throws BoundaryParseError
}
```

Drops the manual `parseInt + isNaN + throw new Error('Invalid…')` triple at lines 222–226, 234–237, 244–247, 254–257 (12 LOC per flag × 3 numeric flags = 36 LOC). Same recipe for `lint-process.ts`, `lint-patterns.ts`, `lint-steps.ts`.

### Site 5: `dangling-baseline.ts:102` (C-GUARD-4 site #3)

```ts
// Before: src/lint/dangling-baseline.ts:102
const parsed = JSON.parse(content) as unknown;
return DanglingBaselineSchema.parse(parsed).slice().sort(compareDanglingEntries);

// After: throws BoundaryParseError instead of raw ZodError — matches projection's parseAndProject:
return parseAtBoundary(DanglingBaselineSchema, JSON.parse(content) as unknown)
  .slice()
  .sort(compareDanglingEntries);
```

(Combined with §1's `tier-a-baseline.ts` rewrite, both file-read boundaries flow through `parseAtBoundary`.)

---

## 4. H-GUARD-4 — Pick one config-loader; delete the wrapper

**File:** core `src/config/config-loader.ts:88-104` defines `loadConfig` — a **12-line wrapper** around `loadProjectConfig` that re-shapes `ResolvedConfig` into a slightly different `ConfigLoadResult` (adds a `found` boolean derived from `!isDefault`).

### Consumer audit (workspace grep)

| Caller | Function | Notes |
|--------|----------|-------|
| `architect-guard/validate-patterns.ts:753` | `loadConfig` | Uses `isDefault` + `path` + `instance` |
| `architect-guard/lint-patterns.ts:218` | `loadConfig` | Same fields |
| `architect-guard/lint-process.ts:264` | `loadProjectConfig` | Uses `instance.registry` + `project.sources` |
| `architect-cli/generate-docs.ts:202` | `loadProjectConfig` | |
| `architect-cli/pattern-graph-cli-runtime.ts:38, 158` | `loadProjectConfig` | |
| `architect-mcp/pipeline-session.ts:180` | `loadProjectConfig` | |

**4 of 6 callers use `loadProjectConfig` already.** `loadConfig`'s only added value is the boolean `found` field, which `validate-patterns.ts:759` immediately destructures as `!isDefault && configPath`. Redundant.

### Recipe

Delete `loadConfig` (core `config-loader.ts:88-104`) and its barrel re-export. Migrate the 2 `loadConfig` callers:

```ts
// Before — src/cli/validate-patterns.ts:753-761
const configResult = await loadConfig(config.baseDir);
if (!configResult.ok) {
  console.error(formatConfigError(configResult.error));
  process.exit(1);
}
const { instance: dpInstance, isDefault, path: configPath } = configResult.value;
const configSource = !isDefault && configPath ? configPath : '(built-in default role set)';

// After — single API:
const configResult = await loadProjectConfig(config.baseDir);
if (!configResult.ok) {
  console.error(formatConfigError(configResult.error));
  process.exit(1);
}
const { instance: dpInstance, isDefault, configPath } = configResult.value;
const configSource = !isDefault && configPath ? configPath : '(built-in default role set)';
```

`lint-patterns.ts:218` — same migration. Result: one config-loading API across the family; 12 LOC deleted from core; no behavior change.

---

## 5. H-GUARD-8 — Phantom PDR-005 reference cleanup

Six references in source + two in `.feature` files cite "PDR-005 FSM" — no `architect/decisions/PDR-005-*.md` exists. PDR-001 governs `scope-validate`/`handoff` in `architect-cli`, not guard.

| File | Line | Text |
|------|------|------|
| `src/lint/process-guard/decider.ts` | 33 | `* 2. **Status Transition** - Transitions must follow PDR-005 FSM` |
| `src/lint/process-guard/decider.ts` | 58 | `* **Invariant:** Status transitions must follow the PDR-005 FSM path.` |
| `src/lint/process-guard/decider.ts` | 283 | `* Uses FSM validation from phase-state-machine module.` |
| `src/lint/process-guard/index.ts` | 14 | `* - Status transitions (must follow PDR-005 FSM)` |
| `src/lint/process-guard/types.ts` | 29 | `* - Protection levels from PDR-005 FSM` |
| `src/cli/lint-process.ts` | 170 | `error    invalid-status-transition  Status transition must follow PDR-005 FSM` |
| `tests/features/process-guard-rules.feature` | 38, 49 | `phase-state-machine` feature suite citation |

**Recommendation:** Author `architect/decisions/PDR-005-process-status-fsm.md` documenting the FSM transition table (already canonically defined in `architect-core/src/validation/fsm/transitions.ts`). The FSM is a real decision worth recording. Once authored, replace the user-facing line 170 string with `"must follow @architect-decision PDR005ProcessStatusFSM"` and leave the JSDoc references as-is — they become valid.

**Alternative if no PDR will be authored:** Strip the 6 source references (mechanical) and rewrite `process-guard-rules.feature:38, 43-48` to inline the transition validity assertion instead of deferring to a nonexistent feature suite (H-GUARD-7).

---

## 6. H-GUARD-1 — `src/index.ts` 12 wildcards → explicit named exports

**File:** `src/index.ts` (24 lines, 12 `export *` wildcards). The public surface is unidentifiable; any internal module rename is a silent breaking change.

### Consumer audit

`architect-cli` is the only `architect-guard` consumer in the workspace. It imports **8 named symbols total**:

| Symbol | Source |
|--------|--------|
| `runLintPatternsCli` | `lint-patterns.ts` |
| `runLintProcessCli` | `lint-process.ts` |
| `runLintStepsCli` | `lint-steps.ts` |
| `runValidatePatternsCli` | `validate-patterns.ts` |
| `compareDanglingBaseline` | `dangling-baseline.ts` |
| `writeDanglingBaseline` | `dangling-baseline.ts` |
| `DANGLING_BASELINE_SOURCE_PATH` | `dangling-baseline.ts` |
| `runProcessGuard` | (cited in `architect/README.md:26`) |

### After

```ts
// src/index.ts — explicit, reviewable surface
// CLI entrypoints (consumed by architect-cli bins):
export {
  runLintPatternsCli,
  runLintProcessCli,
  runLintStepsCli,
  runValidatePatternsCli,
} from './cli/index.js';

// Dangling baseline API (consumed by architect-cli structured commands):
export {
  compareDanglingBaseline,
  writeDanglingBaseline,
  normalizeDanglingBaselineEntries,
  DANGLING_BASELINE_SOURCE_PATH,
  type DanglingBaselineEntry,
  type DanglingBaselineComparison,
} from './lint/dangling-baseline.js';

// Tier-A baseline API (consumed by architect-cli + projection lint integration):
export {
  applyTierABaseline,
  readTierABaseline,
  TIER_A_BASELINE_SOURCE_PATH,
  type TierABaselineEntry,
  type TierABaselineFilterOptions,
} from './lint/tier-a-baseline.js';

// Process guard API:
export { runProcessGuard } from './lint/process-guard/index.js';
export type {
  ProcessState, FileState, SessionState,
  ChangeDetection, StatusTransition, DeliverableChange,
  ValidationResult, ProcessViolation, ProcessGuardRule,
} from './lint/process-guard/types.js';
```

Drops ~12 wildcard re-exports; keeps the 24-LOC barrel reviewable. Anything not listed here was leaking and stays internal. Add a header comment defining "intended consumer surface" (matches core TD-CORE-4 recipe).

---

## 7. H-GUARD-2 — `validate-patterns.ts` 935 LOC mixing 8 concerns

**File:** `src/cli/validate-patterns.ts` (934 lines). Mixes: argv parsing, help output, the cross-source validator (`validatePatterns`, lines 419–574), `formatPretty`, `formatJson`, dangling-baseline enforcement, the `main()` orchestration, and the CLI entrypoint guard.

### Proposed file layout

```
src/cli/validate-patterns/
├── index.ts                    (re-exports runValidatePatternsCli)
├── argv.ts                     (parseArgs + ValidateCLIArgvSchema, ~120 LOC)
├── help.ts                     (printHelp + help text constant, ~80 LOC)
├── validate.ts                 (validatePatterns + isDirectNameMatch
│                                + hasCrossSourceRelationshipMatch, ~180 LOC)
├── dangling-baseline.ts        (enforceDanglingBaseline + formatDanglingEntry, ~40 LOC)
├── format.ts                   (formatPretty + formatJson + codec, ~120 LOC)
└── main.ts                     (main + runValidatePatternsCli + isDirectCliEntrypoint, ~150 LOC)
```

Each split file < 200 LOC; concerns separated; argv schema (§3 above) lands as `argv.ts`'s `ValidateCLIArgvSchema`. `validatePatterns()` (the pure read-model consumer at line 419) becomes the obvious test target — currently entangled with 500 LOC of I/O around it. Land **after** §3 (argv schema) so `argv.ts` is born clean.

---

## 8. H-GUARD-5 — `getDeliverableWorkflowPatterns` → core `PatternGraphAPI`

**File:** `src/validation/dod-validator.ts:154-166`. Function is a pure filter over `RuntimePatternGraph.bySourceType.gherkin` — exactly the shape core's `PatternGraphAPI` exposes.

### Recipe

Move to `architect-core/src/read-api/pattern-graph-api.ts`:

```ts
// In PatternGraphAPI class:
getDeliverableWorkflowPatterns(phaseFilter: readonly number[] = []): readonly ExtractedPattern[] {
  const shouldFilterPhases = phaseFilter.length > 0;
  return this.graph.bySourceType.gherkin.filter((pattern) => {
    if (pattern.phase === undefined) return false;
    const isCompleted = isPatternComplete(pattern.status);
    return shouldFilterPhases ? phaseFilter.includes(pattern.phase) : isCompleted;
  });
}
```

Guard-side callers (`validate-patterns.ts:520`, `dod-validator.ts:193`) consume it through the API:

```ts
// Before:
import { getDeliverableWorkflowPatterns } from '../validation/dod-validator.js';
for (const p of getDeliverableWorkflowPatterns(dataset)) { /* … */ }

// After (core's API already used elsewhere):
const api = createPatternGraphAPI(dataset);
for (const p of api.getDeliverableWorkflowPatterns()) { /* … */ }
```

Delete the guard-side `getDeliverableWorkflowPatterns` (lines 154–166). One more piece of pattern-graph traversal back where it belongs.

---

## Medium-leverage recipes (table)

| ID | Recipe | Files |
|----|--------|-------|
| H-GUARD-12 | Replace `console.warn`/`console.error` with the `Result<T, GuardError>` pattern that `engine.ts` already exposes; the 4 CLI files use both styles inconsistently | `cli/*.ts` |
| H-GUARD-14 | Define one shared `LintDiagnostic` type in `src/lint/types.ts` (currently `lint/`, `lint/steps/`, `lint/process-guard/`, `validation/` each have their own violation shape — 4 near-isomorphic interfaces) | `src/lint/*/types.ts`, `src/validation/types.ts` |
| H-GUARD-6 | `dangling-baseline.ts:106-117` `writeDanglingBaseline` dual-write — only write to `SOURCE_BASELINE_RESOURCE_PATH` and let `prepack` copy. Eliminate `resolveWritableBaselinePaths`; consumer-side write becomes single-target | `lint/dangling-baseline.ts:48-58` |
| M-SIMP-GUARD-1 | `hasAcceptanceCriteria` (dod-validator.ts:56) + `extractAcceptanceCriteriaScenarios` (line 72) duplicate the `semanticMatch || tagMatch` predicate — extract `isAcceptanceCriteriaScenario(scenario)` once | `validation/dod-validator.ts:56-82` |
| M-SIMP-GUARD-2 | `validate-patterns.ts:419-574` does name-map building twice (TS→Gherkin at lines 425-434, Gherkin→TS at 498-516) — extract `buildPatternNameMap(patterns)` helper | `cli/validate-patterns.ts` |
| M-SIMP-GUARD-3 | Replace `parseInt(nextArg, 10) + isNaN` with `Number.parseInt` + `Number.isNaN` family-wide (matches core F4A-M-4) | `cli/*.ts` (12 sites) |

---

## Sweep patterns

1. **`parseInt(arg, 10) + isNaN` → Zod coerce.** All 4 CLI files. Recipe lands as part of §3 (argv schema). Delete every "Invalid X: must be positive integer" bespoke throw.
2. **`as ProcessStatusValue` / `as AcceptedStatusValue` casts.** Three sites in `detect-changes.ts`; whatever other call sites exist (run grep) — replace with `isValidProcessStatus` type guard.
3. **`z.object` → `z.strictObject`.** Only one site (`AntiPatternThresholdsSchema:81`) — flagged in §2.
4. **Hand-written `DEFAULT_*` constants parallel to a schema.** Only `DEFAULT_THRESHOLDS` in this package — derive from `.parse({})`.
5. **`JSON.parse(content) as unknown` followed by `Schema.parse(...)`.** Two sites (`dangling-baseline.ts:102`, the new `tier-a-baseline.ts:102` post-§1). Both flow through `parseAtBoundary`.
6. **`from 'fs'` / `from 'path'` → `from 'node:fs'` / `from 'node:path'`.** Several files in guard (engine.ts, tier-a-baseline.ts post-conversion). Matches core F4A-L-1.

---

## Landing order (dependency-aware)

Each step is mergeable in isolation; later steps depend on earlier.

1. **Author PDR-005** (or commit to stripping; §5). Process step; unblocks doc-cleanup in §1 + §2.
2. **Core: export `isValidProcessStatus` + `StatusValueSchema`** (one core PR; closes C-CORE-5; this is the dependency for §3).
3. **§4 `loadConfig` deletion** (12 LOC core, 2 guard call sites). Pure migration; no other dependencies.
4. **§3 + §6 in one PR:** argv schema, three `parseAtBoundary` adoptions, three FSM cast eliminations, explicit barrel exports. Closes C-GUARD-1, C-GUARD-4, H-GUARD-1.
5. **§2 `process-guard/types.ts` + `AntiPatternThresholdsSchema`** sweep. Closes C-GUARD-3. After step 4 because argv schema imports already-strict thresholds schema.
6. **§1 `tier-a-baseline.ts` JSON migration.** Closes C-GUARD-2 + H-GUARD-11. Drops `--baseline` flag (added in step 4's argv schema). Includes data extraction + scripts/copy-baselines.mjs rename.
7. **§7 `validate-patterns.ts` split** into 6 files. Closes H-GUARD-2. After step 4 (argv module already pre-extracted) and step 6 (tier-a applier already at ~70 LOC).
8. **§8 `getDeliverableWorkflowPatterns` → core** (cross-package; small but coordinated). Closes H-GUARD-5.
9. **Medium-recipe table** rolled up as small follow-up PRs.

**Net impact:** ~1,150 LOC deleted (1,068 from §1, 305→150 in §2, 12 from §4, dead help-text reductions in §7), three Critical findings closed (C-GUARD-1 through C-GUARD-4 split across two), six High findings closed (H-GUARD-1, H-GUARD-2, H-GUARD-4, H-GUARD-5, H-GUARD-8, H-GUARD-11), zero behavior changes.

---

## What's already clean (preserve)

- `src/lint/dangling-baseline.ts` — Zod schema, optional override path, sort-stable comparison, build-time copy. Reference shape for §1.
- `src/lint/engine.ts` — pure `summarizeLintResults`; right place for the helper extracted in §1.
- `src/validation/dod-validator.ts` — small, well-named, pure functions. No simplification needed beyond §8 move + M-SIMP-GUARD-1 predicate extraction.
- Zero `@ts-ignore` / `eslint-disable` / `TODO` / `FIXME` in `src/` — matches family.
- `package.json` build hygiene (`prepack`, `pnpm clean && pnpm build`, `typecheck` covers both configs) — matches family.
- `scripts/copy-dangling-baseline.mjs` build-time copier — extend to two baselines per §1, not replace.
- FSM consumer narrowing at `decider.ts:300` — discriminated `TransitionValidationResult` recipe lands in core; guard's call site is correct receiver shape.

---

## Citations

Phase 1 IDs cited in this report: C-GUARD-1, C-GUARD-2, C-GUARD-3, C-GUARD-4, H-GUARD-1, H-GUARD-2, H-GUARD-4, H-GUARD-5, H-GUARD-6, H-GUARD-7, H-GUARD-8, H-GUARD-11, H-GUARD-12, H-GUARD-14. Cross-package: core C-CORE-5, core TD-CORE-1, core TD-CORE-4, core F4A-M-4, core F4A-L-1, projection C-PROJ-2.
