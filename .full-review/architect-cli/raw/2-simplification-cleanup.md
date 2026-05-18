# architect-cli — Phase 2: Simplification & Cleanup

**Package:** `@libar-dev/architect-cli@2.0.0-pre.1`
**Scope:** 26 src files / ~3,870 SLOC; 9 test files; 6 bin shims (5 LOC each).

## Executive summary

cli is already the doctrine reference for **trust-boundary parsing** in the family (12 `parseAtBoundary` call sites; only package with table-driven dispatcher) — but it carries three concentrated debt clusters that simplify into well-bounded, mechanical edits:

1. **One file, `generate-docs.ts` (672 LOC), holds all the debt.** `parseArgs` (`:214-315`) is the entire 100-LOC hand-rolled argv anti-pattern (C-CLI-1). The three filter-parsing functions (`:128-169`) are duplicated against `commands/read.ts:62-99` (C-CLI-2). The bin uses `void main().catch` + raw `process.exit(error instanceof BoundaryParseError ? 2 : 1)` while every other bin uses a different exit strategy (H-CLI-Q-3, H-CLI-Q-4). All four findings collapse into one cohesive rewrite: route argv through a `ParsedGenerateArgsSchema` and centralize error/exit in a shared `runCliEntrypoint` helper.

2. **C-CLI-3 deletion is a no-op for cli.** `CLI_SCHEMA`/`showHelp`/`CliReferenceGenerator` have **zero source consumers** (verified — grep results show only the core export site, dist artifacts, and the JSDoc claiming consumers that don't exist). cli already has its own self-contained help system at `commands/_shared/help.ts` (73 LOC). The deletion lands in core; cli has no migration burden.

3. **10 `as { readonly ... }` flag-narrowing casts** + **3 helper-layer casts** are the only Zod-discipline gap inside the package (H-CLI-Q-1, M-CLI-11). They all sit downstream of `parseCommandInput` which already returns Zod-parsed `flags`. The fix is a one-line type-witness function per command driven by the per-command flag schema's `z.infer`. Zero runtime cost; removes 75+ lines of hand-written type structure.

The cleanup audit (configs, deps, bins, dist) finds **the package is already best-in-family** on every axis except (a) `runtime-helpers.ts:30` not using `fileURLToPath` (M-CLI-3 / M-CLI-4 — Windows hazard) and (b) the `src/index.ts` JS surface being dead code (H-CLI-1, H-CLI-5).

---

## 1. High-leverage simplification recipes

### Recipe 1 — C-CLI-1: rewrite `generate-docs.ts` argv parser as Zod schema

**File:** `src/cli/generate-docs.ts:41-52, 214-315`
**Affected:** 100 LOC (`parseArgs`) + 12 LOC (`ParsedArgs` interface) = 112 LOC → ~55 LOC.
**Coverage:** Closes C-CLI-1, H-CLI-Q-3 (one of two sites), L-CLI-7 (one of two sites), partial F4A-G-H-3 sibling case.

The dispatcher pattern in `pattern-graph-cli-commands.ts:113-198 parseCommandInput` is the right shape for this bin too — it already routes raw flags through `flagParsers` (kind: 'boolean' | 'value'), preserves `BoundaryParseError.cause` via `formatZodError`, and `parseAtBoundary`s the assembled flags. We don't need the `architect` bin's _runtime_ (commands, REPL); we need its _parsing primitive_.

Two options. **Option A** (recommended): factor the argv→`{positional, flags}` walker out of `pattern-graph-cli-commands.ts` into `commands/_shared/argv.ts` and reuse it. **Option B** (less code): keep `generate-docs` standalone but replace the switch with a schema-driven generator.

Recipe (Option B, the smaller diff):

```typescript
// New: src/cli/commands/_shared/generate-args.ts
import { RenderFormatSchema, parseAtBoundary } from '@libar-dev/architect-core';
import {
  ProgressiveDisclosureLevelSchema,
  ProjectionFilterSchema,
} from '@libar-dev/architect-projection';
import { z } from 'zod';
import { parseFilterValue, parseDisclosureLevel } from './projection-filter.js'; // see Recipe 2
import { mergeProjectionFilter } from './projection-filter.js';

export const GenerateArgsSchema = z
  .strictObject({
    help: z.boolean(),
    version: z.boolean(),
    listGenerators: z.boolean(),
    baseDir: z.string(),
    input: z.array(z.string()).readonly(),
    generators: z.array(z.string()).readonly(),
    outputDir: z.string().optional(),
    overwrite: z.boolean(),
    disclosureLevel: ProgressiveDisclosureLevelSchema.optional(),
    projectionFilter: ProjectionFilterSchema.optional(),
  })
  .readonly();

export type GenerateArgs = z.output<typeof GenerateArgsSchema>;
```

```typescript
// generate-docs.ts — replaces lines 41-52 and 214-315
// (deletes hand-written ParsedArgs interface; deletes all six
//  `if (next === undefined || next.startsWith('-')) throw …` blocks)
import { assertHasValue, parseAtBoundary } from '@libar-dev/architect-core';
import { GenerateArgsSchema, type GenerateArgs } from './commands/_shared/generate-args.js';

interface FlagDef {
  readonly aliases: readonly string[];
  readonly kind: 'boolean' | 'value';
  readonly accumulate?: 'csv' | 'array' | 'filter-merge';
  readonly parse?: (raw: string) => unknown;
  readonly key: keyof GenerateArgs;
}

const FLAGS: readonly FlagDef[] = [
  { aliases: ['-h', '--help'], kind: 'boolean', key: 'help' },
  { aliases: ['-v', '--version'], kind: 'boolean', key: 'version' },
  { aliases: ['--list-generators'], kind: 'boolean', key: 'listGenerators' },
  { aliases: ['-b', '--base-dir'], kind: 'value', key: 'baseDir', parse: resolveCliBaseDirArg },
  { aliases: ['-g', '--generators'], kind: 'value', key: 'generators', accumulate: 'csv' },
  { aliases: ['-i', '--input'], kind: 'value', key: 'input', accumulate: 'array' },
  { aliases: ['-o', '--output'], kind: 'value', key: 'outputDir' },
  { aliases: ['-f', '--overwrite', '--force'], kind: 'boolean', key: 'overwrite' },
  { aliases: ['--disclosure'], kind: 'value', key: 'disclosureLevel', parse: parseDisclosureLevel },
  {
    aliases: ['--filter'],
    kind: 'value',
    key: 'projectionFilter',
    accumulate: 'filter-merge',
    parse: parseFilterValue,
  },
];

function parseArgs(argv: readonly string[]): GenerateArgs {
  const raw: Record<string, unknown> = {
    help: false,
    version: false,
    listGenerators: false,
    baseDir: resolveInvocationDir(),
    input: [],
    generators: [],
    overwrite: false,
  };
  const args = argv.filter((arg) => arg !== '--');

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === undefined) continue;
    const flag = FLAGS.find((f) => f.aliases.includes(arg));
    if (flag === undefined) throw new Error(`Unknown option: ${arg}`);

    if (flag.kind === 'boolean') {
      raw[flag.key] = true;
      continue;
    }
    const next = args[i + 1];
    assertHasValue(next, arg); // single helper, replaces six inline checks
    const parsed = flag.parse ? flag.parse(next) : next;

    switch (flag.accumulate) {
      case 'csv':
        raw[flag.key] = [...(raw[flag.key] as string[]), ...splitGeneratorValue(next)];
        break;
      case 'array':
        raw[flag.key] = [...(raw[flag.key] as string[]), parsed];
        break;
      case 'filter-merge':
        raw[flag.key] = mergeProjectionFilter(
          raw[flag.key] as ProjectionFilter | undefined,
          parsed as ProjectionFilter,
        );
        break;
      default:
        raw[flag.key] = parsed;
    }
    i += 1;
  }

  return parseAtBoundary(GenerateArgsSchema, raw, 'Failed to parse architect-generate arguments');
}
```

Net wins:

- Six `if (next === undefined || next.startsWith('-'))` blocks → one `assertHasValue(next, arg)` (already exists in core).
- Hand-written `ParsedArgs` interface → `z.output<typeof GenerateArgsSchema>`.
- Bin exit at `:303-314` (`...(outputDir !== undefined ? { outputDir } : {})` spread dance) → schema's `.optional()` does it for free.
- Doctrine: per AGENTS.md "every CLI/MCP input boundary is a Zod schema" — the assembled object now is.

### Recipe 2 — C-CLI-2: extract projection-filter helpers to `_shared/projection-filter.ts`

**Files:** `src/cli/generate-docs.ts:128-169` (3 functions) + `src/cli/commands/read.ts:62-99` (same 3 functions).
**Affected:** 42 LOC + 38 LOC = 80 LOC of duplication → one 35-LOC shared module.
**Coverage:** Closes C-CLI-2.

The two implementations differ only in (a) `parseSchemaValue` (read.ts) vs `parseAtBoundary` (generate-docs.ts) and (b) `mergeProjectionFilter` signature (`readonly ProjectionFilter[]` vs `current?: ProjectionFilter, next: ProjectionFilter`). Both differences are accidental — Phase 1 notes (H-CLI-Q-7) `parseSchemaValue` is _worse_ than `parseAtBoundary` because it swallows the Zod cause. **Unify on `parseAtBoundary` directly.**

```typescript
// New: src/cli/commands/_shared/projection-filter.ts
import { parseAtBoundary } from '@libar-dev/architect-core';
import {
  ProgressiveDisclosureLevelSchema,
  ProjectionFilterSchema,
  type ProgressiveDisclosureLevel,
  type ProjectionFilter,
} from '@libar-dev/architect-projection';

export function parseDisclosureLevel(value: string): ProgressiveDisclosureLevel {
  return parseAtBoundary(ProgressiveDisclosureLevelSchema, value, '--disclosure');
}

export function parseFilterValue(value: string): ProjectionFilter {
  const separatorIndex = value.indexOf('=');
  if (separatorIndex <= 0) {
    throw new Error('--filter requires <status>=<csv>');
  }
  const axis = value.slice(0, separatorIndex);
  const tokens = value
    .slice(separatorIndex + 1)
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  return parseAtBoundary(ProjectionFilterSchema, { [axis]: tokens }, '--filter');
}

// Single signature: `current` optional, `next` may be undefined for batch use.
// Accumulator-friendly — matches generate-docs.ts's reduce pattern AND
// supports read.ts's `readonly ProjectionFilter[]` use case via a one-line wrapper.
export function mergeProjectionFilter(
  current: ProjectionFilter | undefined,
  next: ProjectionFilter,
): ProjectionFilter {
  const status = [...(current?.status ?? []), ...(next.status ?? [])];
  return parseAtBoundary(ProjectionFilterSchema, status.length > 0 ? { status } : {}, '--filter');
}

export function mergeProjectionFilters(
  filters: readonly ProjectionFilter[],
): ProjectionFilter | undefined {
  if (filters.length === 0) return undefined;
  return filters.reduce<ProjectionFilter>(mergeProjectionFilter, {});
}
```

`commands/read.ts` and `generate-docs.ts` each delete their three local functions and import from the new module. **Side effect:** H-CLI-Q-7 also closes — `parseSchemaValue`'s swallowed-Zod-cause path is no longer invoked for these filters (it remains for the legitimate enum-value parsers in `_shared/schemas.ts`, which is the right scope).

### Recipe 3 — C-CLI-3: delete dead `CLI_SCHEMA` / `showHelp` / `CliReferenceGenerator` from core

**Confirmation grep:** `grep -RIn 'CLI_SCHEMA\|showHelp\|CliReferenceGenerator' packages/*/src/ 2>/dev/null` returns:

- `architect-core/src/index.ts:237` (the barrel re-export)
- `architect-core/src/config/cli-schema.ts:12, 13, 100` (the self-referential JSDoc + the definition)

**Zero consumers in any other workspace src file.** All other matches are `node_modules` (vitest's internal CLI library, unrelated) or `dist/` (built artifacts of the same dead surface).

**Action (in core, not cli):**

1. Delete `architect-core/src/config/cli-schema.ts` (610 LOC).
2. Delete the export block in `architect-core/src/index.ts:237` and the type re-exports (`CLI_SCHEMA`, `CLIOptionDef`, `CLIOptionGroup`, `CLISchema`, `CommandNarrative`, `CommandNarrativeGroup`, `RecipeExample`, `RecipeGroup`, `RecipeStep`).
3. Run `pnpm -r typecheck` — should be a no-op (Phase 1 confirmed); if any package breaks, the JSDoc comment lied.

**cli has nothing to migrate.** The cli's help system (`commands/_shared/help.ts`) is fully decoupled from `CLI_SCHEMA` (it reads `COMMANDS[name].helpSignature`/`helpDetail`). The H-CORE-5 _premise_ is correct; the _recommendation_ (move) is wrong — delete.

### Recipe 4 — H-CLI-2: derive `knownTypes` from `DocError` discriminator (or just trust TypeScript)

**File:** `src/cli/error-handler.ts:74-87`.
**Affected:** 14 LOC of hand-listed strings.
**Coverage:** Closes H-CLI-2.

The `knownTypes` runtime array (`'FILE_SYSTEM_ERROR'`, `'FILE_PARSE_ERROR'`, …, 12 entries) duplicates the `DocError` discriminator union in `architect-core/src/types/errors.ts:174-186`. Adding a new variant to `DocError` requires editing this array too — there's no compile-time link.

Two viable fixes:

**Option A (preferred): export a Zod-schema discriminator from core.**

Core already has the `DocError` interface union but no schema; add one. In `architect-core/src/types/errors.ts`:

```typescript
import { z } from 'zod';

export const DOC_ERROR_TYPES = [
  'FILE_SYSTEM_ERROR',
  'FILE_PARSE_ERROR',
  'DIRECTIVE_VALIDATION_ERROR',
  'PATTERN_VALIDATION_ERROR',
  'REGISTRY_VALIDATION_ERROR',
  'MARKDOWN_GENERATION_ERROR',
  'FILE_WRITE_ERROR',
  'FEATURE_PARSE_ERROR',
  'CONFIG_ERROR',
  'PROCESS_METADATA_VALIDATION_ERROR',
  'DELIVERABLE_VALIDATION_ERROR',
  'GHERKIN_PATTERN_VALIDATION_ERROR',
] as const;

export const DocErrorTypeSchema = z.enum(DOC_ERROR_TYPES);
export type DocErrorType = z.infer<typeof DocErrorTypeSchema>;

// Single source of truth — make DocError.type extend DocErrorType:
export interface BaseDocError {
  readonly type: DocErrorType;
  readonly message: string;
}
```

Then cli reduces to:

```typescript
// src/cli/error-handler.ts:61-90 — collapses to ~10 lines
import { DocErrorTypeSchema, type DocError } from '@libar-dev/architect-core';

export function isDocError(error: unknown): error is DocError {
  if (error === null || typeof error !== 'object') return false;
  const maybeError = error as { type?: unknown; message?: unknown };
  return (
    typeof maybeError.message === 'string' && DocErrorTypeSchema.safeParse(maybeError.type).success
  );
}
```

**Option B (cli-only, no core change): delete `isDocError`.** Per H-CLI-1 / H-CLI-5: the three exports from `src/index.ts` (`isDocError`, `formatDocError`, `handleCliError`) have **zero consumers** in the workspace (verified — `handleCliError` matches are all from `architect-guard/src/cli/shared.ts:24`, a separately-defined local function, not the cli's export). If the entire `src/index.ts` JS surface is unused, the simplest fix is to delete it and republish the package as bin-only (drop `main`, `module`, `types`, the `.` export, and the `error-handler.ts` file). Doctrine alignment: cli is a "thin composition root", not a library.

Recommendation: **Option B** for the cli (deletion is the No-BC default), **Option A** for the core types module — it's a doctrine win regardless of who consumes `isDocError`.

### Recipe 5 — H-CLI-Q-1 / M-CLI-11: drive command flag types from `z.infer`, not `as` casts

**Files:** 10 cast sites + 3 shared-helper cast sites = 13 sites:

- `commands/meta.ts:63, 72, 103`
- `commands/read.ts:159, 226, 284, 326`
- `commands/reporting.ts:76, 110, 145`
- `commands/_shared/handoff.ts:21`
- `commands/_shared/projection-options.ts:11, 53`

Each looks like:

```typescript
const flags = parsed.flags as { readonly count?: boolean; readonly namesOnly?: boolean };
```

This is a hand-rolled witness duplicating the schema. The schemas already exist (`RulesFlagsSchema`, `TaxonomyFlagsSchema`, etc. in `commands/_shared/schemas.ts`). The fix is to thread the schema's `z.infer` through `CommandDef`.

**Recipe:** parametrize `CommandDef` over its flags schema.

```typescript
// pattern-graph-cli-commands.ts — replaces the existing CommandDef
export interface CommandDef<
  TFlags extends Readonly<Record<string, unknown>> = Readonly<Record<string, unknown>>,
> {
  readonly name: CommandName;
  readonly positional: z.ZodType<readonly string[]>;
  readonly flags: z.ZodType<TFlags>;
  readonly usage?: string;
  readonly helpSignature: string;
  readonly helpDetail?: CommandHelpDetail;
  readonly requiresCliContext?: boolean;
  readonly rejectBareValues?: boolean;
  readonly treatUnknownFlagsAsPositionals?: boolean;
  readonly flagParsers?: Readonly<Record<string, FlagParser>>;
  readonly validateParsedInput?: (parsed: ParsedCommandInput<TFlags>) => void;
  readonly execute: (
    context: CommandRuntimeContext,
    parsed: ParsedCommandInput<TFlags>,
  ) => Promise<void> | void;
}

export interface ParsedCommandInput<TFlags = Readonly<Record<string, unknown>>> {
  readonly positional: readonly string[];
  readonly flags: TFlags; // typed, not `Readonly<Record<string, unknown>>`
  readonly rawArgv: readonly string[];
}
```

`parseCommandInput` already calls `parseAtBoundary(def.flags, rawFlags, ...)` (`pattern-graph-cli-commands.ts:180`) which returns the inferred `TFlags` type at runtime — the generic just makes TypeScript see it. The single `COMMANDS: Record<CommandName, CommandDef>` registry needs to widen the type parameter to keep heterogeneous flags coexisting, but that's a one-line `Record<CommandName, CommandDef<Readonly<Record<string, unknown>>>>` at the registry level.

Per-command file gets:

```typescript
// commands/meta.ts — `rules` command, replaces lines 62-66
execute(context, parsed): void {
  // parsed.flags is now typed as z.infer<typeof RulesFlagsSchema>
  if (parsed.flags.namesOnly === true) {
    // …no cast needed…
  }
  if (parsed.flags.count === true) { … }
}
```

Removes 13 `as` casts, ~75 lines of hand-written flag-shape declarations, and the only Zod-discipline gap inside the package. **Type witness aligns with runtime parser by construction.**

The remaining `Object.values(ruleSet.children) as { rules: ... }[]` at `commands/meta.ts:72` (L-CLI-5) is a _different_ cast — it's projection's bundle accessor missing a typed `.children` shape; that's a projection-side fix, not cli's.

### Recipe 6 — H-CLI-Q-4: unify three exit-code strategies on one helper

**Current state:**

| Site                                 | Pattern                                                     | Exit code             |
| ------------------------------------ | ----------------------------------------------------------- | --------------------- |
| `error-handler.ts:231`               | `process.exit(exitCode)`                                    | parameter, default 1  |
| `pattern-graph-cli.ts:273`           | `process.exit(1)`                                           | fixed 1               |
| `pattern-graph-cli.ts:236`           | `process.exit(1)`                                           | fixed 1 (no-arg help) |
| `generate-docs.ts:671`               | `process.exit(error instanceof BoundaryParseError ? 2 : 1)` | branched              |
| `commands/_shared/structured.ts:227` | `process.exitCode = 1`                                      | deferred              |

Three different strategies; one of them (`generate-docs`) has the "right" idea (distinguish argv parse failures with code 2) but only on its own bin.

**Recipe:** one shared entrypoint helper, plus a documented exit-code contract.

```typescript
// New: src/cli/commands/_shared/entrypoint.ts
import { BoundaryParseError } from '@libar-dev/architect-core';

const EXIT_CODES = {
  success: 0,
  generic: 1,
  argvParse: 2, // BoundaryParseError at the trust boundary
} as const;

export async function runCliEntrypoint(main: () => Promise<void>): Promise<never> {
  try {
    await main();
    process.exit(process.exitCode ?? EXIT_CODES.success);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(error instanceof BoundaryParseError ? EXIT_CODES.argvParse : EXIT_CODES.generic);
  }
}
```

Then both bin entrypoints become:

```typescript
// pattern-graph-cli.ts:271-274  AND  generate-docs.ts:669-672
import { runCliEntrypoint } from './commands/_shared/entrypoint.js';

await runCliEntrypoint(main);
```

Notes:

- Replaces `void main().catch(…)` (closes L-CLI-7, H-CLI-Q-3 in both files) with `await` — the family-wide ESLint rule banning `void <expression>` (core's F4A-H-9, guard's F4A-G-H-5) catches both sites in one move.
- `commands/_shared/structured.ts:227 process.exitCode = 1` (the `arch dangling --strict` drift case, M-CLI-8) is preserved: the helper reads `process.exitCode` and respects it. The "strict failed" deferred-exit semantics survive verbatim; the inconsistency is the only acceptable one because the response is still written to stdout (per M-CLI-8 it's a documented quirk, not a bug — but the new helper makes it explicit).
- `console.error` in `error-handler.ts:219, 222, 224, 228` (H-CLI-Q-2) — if Option B in Recipe 4 lands (delete the file), this is moot. Otherwise replace with `process.stderr.write(...)` to match the rest of the package.

---

## 2. Cleanup findings by severity

### High

| ID        | Finding                                                                                                                                                                                                                                                                                              | Location                                              | Recipe                                                                                                                                                                                                                                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CL-CLI-H1 | `src/index.ts` JS surface has no workspace consumers. Three exports (`isDocError`, `formatDocError`, `handleCliError`) compile to `dist/index.js` + 4 `.d.ts.map` artifacts and ship via `main`/`module`/`types` for zero callers.                                                                   | `src/index.ts:1`; `package.json:22-29`                | Delete `src/index.ts`, `src/cli/error-handler.ts` (232 LOC); drop `main`, `module`, `types`, `.` export from `package.json`; `files` array becomes `["bin", "dist", "runtime-bridge.js"]` (already correct, but dist/index.\* will no longer exist). Closes H-CLI-1, H-CLI-5, H-CLI-Q-2, M-CLI-1 in one delete. |
| CL-CLI-H2 | `generated-docs-manifest.ts:157-191` is 30 LOC of hand-rolled JSON validation that should be `z.strictObject`.                                                                                                                                                                                       | `src/cli/generated-docs-manifest.ts:48-50, 157-191`   | Replace `isGeneratedDocsManifest`/`isGeneratorManifest`/`isManifestEntry` triple with three schemas + `safeParse`. ~20 LOC. Closes H-CLI-6, H-CLI-Q-6. Aligned with core's C-CORE-4 fix; defer until that lands so the cli inherits the recipe.                                                                 |
| CL-CLI-H3 | `pattern-graph-cli-runtime.ts:33-80 resolveSourcePlan` and `:153-173 resolveTagRegistryForTaxonomy` both fetch `workspaceSources`/`configResult`/`configPath` independently.                                                                                                                         | `src/cli/pattern-graph-cli-runtime.ts:33-80, 153-173` | Extract `loadCliConfigContext(args)` returning `{ workspaceSources, hasWorkspaceSources, configPath, configResult }`. Closes H-CLI-3; ~25 LOC saved.                                                                                                                                                            |
| CL-CLI-H4 | Two `--category` legacy rejects: inline at `pattern-graph-cli.ts:144-149` and via the exported `rejectLegacyCategory()` at `pattern-graph-cli-commands.ts:105-107, 123-124`.                                                                                                                         | (cited)                                               | Replace the inline `case '--category'` + the `default` branch's `startsWith('--category=')` check in `pattern-graph-cli.ts` with a single call to the exported `rejectLegacyCategory()`. Closes H-CLI-8; ~6 LOC saved.                                                                                          |
| CL-CLI-H5 | The `architect` bin's `parseArgs` (`pattern-graph-cli.ts:46-179`) is the _only_ parser that correctly uses `parseAtBoundary` at exit — but `--feature`/`--session`/`--depth` have a "if remaining is non-empty, push to remaining instead" rule (`:101-127`) that makes flag order matter (M-CLI-5). | `src/cli/pattern-graph-cli.ts:100-127`                | Document explicitly in the function's JSDoc; ideally restructure as positional-first walk (split argv at the first non-flag token, then run flag-walk only on the prefix). Defer; behaviour-stable refactor only after Recipe 5 lands.                                                                          |

### Medium

| ID        | Finding                                                                                                                                                                                       | Location                                       |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| CL-CLI-M1 | `runtime-helpers.ts:30 new URL('../../package.json', import.meta.url).pathname` is POSIX-only — breaks on Windows. `:59` and `pattern-graph-cli-runtime.ts:60` use `fileURLToPath` correctly. | `src/cli/runtime-helpers.ts:30`                |
| CL-CLI-M2 | `runtime-bridge.js:6 path.dirname(new URL(import.meta.url).pathname)` — same Windows hazard in the bin resolver.                                                                              | `runtime-bridge.js:6`                          |
| CL-CLI-M3 | `pattern-graph-cli-runtime.ts:132 CacheRecordSchema.parse(JSON.parse(...))` is the only cli call that bypasses `parseAtBoundary`.                                                             | `src/cli/pattern-graph-cli-runtime.ts:132`     |
| CL-CLI-M4 | `pattern-graph-cli-types.ts:33-41 SourcePlan` and `:52-60 CliContext` are hand-written interfaces while siblings `ParsedArgsSchema` and `CacheRecordSchema` in the same file are Zod schemas. | `src/cli/pattern-graph-cli-types.ts:33-60`     |
| CL-CLI-M5 | `COMMANDS` registry spread (`pattern-graph-cli-commands.ts:97-103`) has no disjointness assertion across the 5 module records — a duplicate key silently wins-by-spread-order.                | `src/cli/pattern-graph-cli-commands.ts:97-103` |

Fixes for M1/M2 are mechanical: import `fileURLToPath` and wrap the `new URL(...)` call. Total diff ~4 lines.

### Low

| ID        | Finding                                                                                                                                                                                                   | Location                      |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| CL-CLI-L1 | `version.ts:42` fallback returns `'architect'`, causing `printVersion` to render `"architect (architect) vX.Y.Z"`.                                                                                        | `src/cli/version.ts:42-47`    |
| CL-CLI-L2 | `tests/features/.DS_Store` checked in.                                                                                                                                                                    | (cited)                       |
| CL-CLI-L3 | `tests/support/run-cli.ts:31 split(/\s+/)` mishandles quoted args — fine for current suite (no quoted args) but a latent foot-gun.                                                                        | `tests/support/run-cli.ts:31` |
| CL-CLI-L4 | `commands/lifecycle.ts:46`, `meta.ts:141`, `planning.ts:121`, `read.ts:401`, `reporting.ts:166` all repeat `satisfies Pick<Record<CommandName, CommandDef>, …>`. A `CommandModule<K>` alias deduplicates. | (cited)                       |

### Test-feature `@skip` audit (Phase 1 H-CLI-T-2 follow-up)

The 4 `@skip` scenarios in `tests/features/cli-flag-parsing.feature` and `cli-output-formatting.feature`:

| File:Line                             | Tag                 | Reason (from comment)                                                                                                                            | Fix path                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cli-flag-parsing.feature:41-45`      | `@skip @validation` | Current CLI emits `--format must be compact or json` rather than a Zod-shaped `Invalid…format` diagnostic.                                       | **Lands automatically with Recipe 5 + 6:** once `parseCommandInput` flag failures preserve `BoundaryParseError.cause` (already does at `:185-191`) AND the value parser at `pattern-graph-cli.ts:136-140` stops catching+rethrowing as `'--format must be compact or json'`. Today's `try { parseAtBoundary(RenderFormatSchema, next, '--format'); } catch { throw new Error('--format must be compact or json'); }` block is the offender — swallows the structured Zod error. Delete the try/catch; let `BoundaryParseError` propagate. Scenario then passes verbatim. |
| `cli-flag-parsing.feature:49-53`      | `@skip @negative`   | Expects `pattern and productArea cannot be used together` (camelCase); CLI emits `--pattern and --product-area cannot be used together` (kebab). | One-line fix in `commands/_shared/projection-options.ts:69` — `throw new Error('--pattern, --product-area, --package, and --feature cannot be combined');` already lists 4 flags but scenario expects 2-flag wording. Either update the scenario to match the 4-flag list (better) or change the error to camelCase keys (worse — kebab is canonical flag spelling). **Recommend: rewrite scenario.**                                                                                                                                                                    |
| `cli-output-formatting.feature:42-46` | `@skip @happy-path` | `--format markdown` not implemented; CLI accepts only `compact                                                                                   | json`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Aspirational — the scenario is forward-looking. Either delete the scenario (No-BC: aspirational tests are dead code) or implement markdown rendering in the CLI. **Recommend: delete the scenario** until a use case lands. |
| `cli-output-formatting.feature:50-54` | `@skip @contract`   | No CLI invocation currently triggers a deprecation warning.                                                                                      | Same as above — aspirational contract test for a feature that doesn't exist. **Recommend: delete until first deprecation lands.**                                                                                                                                                                                                                                                                                                                                                                                                                                        |

Net: 2 of 4 skipped scenarios become live tests with Recipe-5/6 changes; 2 should be deleted as aspirational dead code (No-BC: pre-1.0 doesn't accumulate forward-looking skipped tests).

---

## 3. Configuration audit vs family

Phase 1 brief asked: "Phase 4 for projection found projection/mcp need typecheck both configs; cli is correct; verify."

### `typecheck` script comparison

| Package                | `typecheck` command                                                   | Status                                                                                          |
| ---------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `architect-core`       | `tsc --noEmit -p tsconfig.test.json`                                  | One config — relies on test config extending main; covers both tree shapes through inheritance. |
| `architect-projection` | `tsc --noEmit -p tsconfig.test.json`                                  | Same as core.                                                                                   |
| `architect-guard`      | `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.test.json` | **Both configs.** Best-in-family alongside cli.                                                 |
| **`architect-cli`**    | `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.test.json` | **Both configs.** Best-in-family alongside guard.                                               |
| `architect-mcp`        | `tsc --noEmit -p tsconfig.test.json`                                  | One config — same as core/projection.                                                           |

**Confirmed: cli is correct.** Brief's claim verified — projection and mcp need to add `tsc --noEmit -p tsconfig.json` to their `typecheck` scripts to match cli/guard. cli has no work item here.

### `lint` scope comparison

| Package                | `lint` command     |
| ---------------------- | ------------------ |
| `architect-core`       | `eslint src`       |
| `architect-projection` | `eslint src tests` |
| `architect-guard`      | `eslint src tests` |
| **`architect-cli`**    | `eslint src tests` |
| `architect-mcp`        | `eslint src tests` |

cli lints both — correct. Only core is incomplete (CL-CORE-10 per Phase 1 cross-reference).

### `prepack` placement

| Package                | `prepack`                                           |
| ---------------------- | --------------------------------------------------- |
| `architect-core`       | `pnpm build` (outside `scripts` block per C-CORE-6) |
| `architect-projection` | `pnpm clean && pnpm build`                          |
| `architect-guard`      | `pnpm clean && pnpm build`                          |
| **`architect-cli`**    | `pnpm clean && pnpm build` (inside `scripts`)       |
| `architect-mcp`        | `pnpm clean && pnpm build`                          |

cli is correct. The C-CORE-6 misplacement does not exist here.

### `tsconfig.test.json` inclusion

cli `tsconfig.test.json:11` includes `["src/**/*", "tests/**/*.ts", "vitest.config.ts"]`. guard includes same; projection/mcp include only `tests/**/*` per Phase 1 cross-references. **cli is reference-quality.**

### `eslint.config.mjs` test-rule relaxations

cli relaxes 6 rules for `tests/**/*.ts` (`eslint.config.mjs:15-24`) — `@typescript-eslint/array-type`, `consistent-type-definitions`, `dot-notation`, `no-non-null-assertion`, `no-redundant-type-constituents`, `no-unnecessary-type-assertion`. Consistent with guard's eslint config. **No drift.**

---

## 4. Dependency audit

`package.json:54-65`:

```json
"dependencies": {
  "@libar-dev/architect-core": "workspace:*",
  "@libar-dev/architect-guard": "workspace:*",
  "@libar-dev/architect-projection": "workspace:*",
  "zod": "^4.1.11"
},
"devDependencies": {
  "@amiceli/vitest-cucumber": "^6.3.0",
  "@types/node": "^24.12.0",
  "eslint": "^9.17.0",
  "typescript": "^5.8.2",
  "vitest": "^4.1.4"
}
```

| Check                               | Result                                                                                                                                                                                                                                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All `dependencies` used?            | core: yes (12 imports); projection: yes (10 imports); guard: yes (4 `runXxxCli` + 5 dangling-baseline types in `commands/_shared/structured.ts`); zod: yes (`commands/_shared/schemas.ts`, `pattern-graph-cli-types.ts`, `pattern-graph-cli-commands.ts`). **No dead deps.** |
| All `devDependencies` used?         | vitest-cucumber: yes (feature files); types/node: yes (`fs/promises`, `path`, etc.); eslint: yes; typescript: yes; vitest: yes. **Clean.**                                                                                                                                   |
| Any prod dep that should be a peer? | No — `architect-cli` is the consumer; the meta package re-exports its bins. Workspace-internal `workspace:*` correctly captured.                                                                                                                                             |
| Any peer dep gap?                   | No peer deps declared; not applicable for a bin package.                                                                                                                                                                                                                     |
| Engines pin?                        | `"node": ">=20.0.0"` consistent with family AGENTS.md "Node.js 20+".                                                                                                                                                                                                         |
| Pinned versions match family?       | zod 4.1.11, typescript 5.8, vitest 4.1, node-types 24.12 — same versions used across family per Phase 1 cross-references. **No drift.**                                                                                                                                      |

**Action:** none. cli's `dependencies` block is the family reference.

### `bin` ↔ `exports` agreement

Both blocks declare all 6 bins. Each `./bin/<name>` subpath export resolves to the same `bin/*.js` file as the `bin` entry. **No drift, no orphans.**

### Are all 6 bins consumed?

Yes — the meta package `architect/package.json` re-exports all 6 via `./bin/*` subpath imports. The 4 guard bin shims (`architect-guard`, `architect-lint-patterns`, `architect-lint-steps`, `architect-validate`) are documented in the repo's README + `AGENTS.md` as the public CLI surface. **No dead bins.**

### Are all `package.json#exports` subpaths used?

- `.` → `dist/index.js` — **no external consumers** (CL-CLI-H1). Drop.
- `./bin/architect` through `./bin/architect-lint-steps` (6 subpaths) — consumed by the meta package `architect/package.json` re-exports. **All used.**
- `./package.json` — convention; used by `readCliPackageMetadata` in `runtime-helpers.ts:30`. **Used.**

After CL-CLI-H1 lands, the `.` export goes away and `exports` block shrinks from 8 entries to 7.

---

## 5. Bin-shim and runtime-bridge audit

### `bin/*.js` uniformity

Verified all 6:

```javascript
// bin/architect.js (representative)
#!/usr/bin/env node
import { runArchitectCliEntrypoint } from '../runtime-bridge.js';

await runArchitectCliEntrypoint('cli/pattern-graph-cli.js');
```

| File                             | Relative entry             | Drift |
| -------------------------------- | -------------------------- | ----- |
| `bin/architect.js`               | `cli/pattern-graph-cli.js` | none  |
| `bin/architect-generate.js`      | `cli/generate-docs.js`     | none  |
| `bin/architect-guard.js`         | `cli/lint-process.js`      | none  |
| `bin/architect-lint-patterns.js` | `cli/lint-patterns.js`     | none  |
| `bin/architect-lint-steps.js`    | `cli/lint-steps.js`        | none  |
| `bin/architect-validate.js`      | `cli/validate-patterns.js` | none  |

**Uniform.** Each is 5 lines, no logic, no parameters baked in. Best-in-family.

### `runtime-bridge.js` review

22 LOC at `runtime-bridge.js:1-24`. Two functions:

- `getPackageRoot()` — derives package root from `import.meta.url`. **POSIX-only** (CL-CLI-M2). Fix: `import { fileURLToPath } from 'node:url'; return path.dirname(fileURLToPath(import.meta.url));`.
- `resolveBuiltEntrypoint(relativePath)` — `fs.existsSync` check on `dist/<relativePath>` with a helpful error pointing at `pnpm --filter @libar-dev/architect-cli build`. Best-in-family.

**Gap (Phase 1 calls out promotion-to-template):** the file is great except for the Windows hazard. After CL-CLI-M2 fix it's ready for workspace-level adoption — mcp's bin entrypoint, the meta package's bin re-exports, and any future bin-shipping package should use the same eager-existence pattern.

**Recipe for workspace promotion:**

1. Apply CL-CLI-M2 fix (replace `new URL(import.meta.url).pathname` with `fileURLToPath`).
2. Generalize the package-name parameter: `runCliEntrypoint(packageName, relativePath)` so the error message can name the right `pnpm --filter ... build`.
3. Move to a workspace-level package (`@libar-dev/architect-internals/runtime-bridge` or similar) — or accept the duplication, since each package needs an unambiguous import-meta-relative path lookup that survives `pnpm` and `npm` symlinking. Phase 1 leaned toward template-not-package; that's likely right.

---

## 6. Files that should not be in `dist/`

cli's `dist/` is currently well-disciplined (every src file maps to a dist file; no orphan emit). The H-CLI-7 inconsistency Phase 1 flagged (4 guard bin shims that bypass `runtime-bridge.js`) is structural — the 4 files (`bin/architect-guard.js`, `bin/architect-lint-patterns.js`, `bin/architect-lint-steps.js`, `bin/architect-validate.js`) do go through the bridge; what they don't do is execute logic in cli's `dist/cli/` tree. They import from `@libar-dev/architect-guard` directly. The 4 thin re-export shims (`src/cli/lint-patterns.ts`, `lint-process.ts`, `lint-steps.ts`, `validate-patterns.ts`) emit to `dist/cli/lint-*.js` and `dist/cli/validate-patterns.js`. **All consumed.**

**One real cleanup target:** if CL-CLI-H1 lands (delete `src/index.ts` + `src/cli/error-handler.ts`):

- `dist/index.js`, `dist/index.d.ts`, `dist/index.d.ts.map`, `dist/index.js.map` — delete (no longer built).
- `dist/cli/error-handler.js`, `dist/cli/error-handler.d.ts`, `dist/cli/error-handler.d.ts.map`, `dist/cli/error-handler.js.map` — delete.

Net: ~8 emit artifacts removed; the `prepack: pnpm clean && pnpm build` ensures the next publish has a clean tree.

**No "files-that-don't-belong" found** beyond the dead exports above. `tests/features/.DS_Store` is repo-tree hygiene (CL-CLI-L2), not a dist concern.

---

## 7. Landing order (dependency-aware)

Each step is independently shippable as a No-BC change. Order is chosen so each step compiles against the previous one's output without touching the same file twice.

| #   | Step                                                                                                                                                                                                                                                                                                                                                                | Files                                                                                                                                                     | Closes                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | **Extract `_shared/projection-filter.ts`.** Move 3 functions out of `generate-docs.ts:128-169` and `commands/read.ts:62-99`. Both files now import from the new module.                                                                                                                                                                                             | new: `commands/_shared/projection-filter.ts`. edit: `generate-docs.ts`, `commands/read.ts`.                                                               | C-CLI-2, H-CLI-Q-7 (for filter path)                               |
| 2   | **Rewrite `generate-docs.ts` argv parser** as `GenerateArgsSchema` + `FLAGS` table. Depends on Step 1 (imports `parseFilterValue`/`parseDisclosureLevel`/`mergeProjectionFilter`).                                                                                                                                                                                  | `generate-docs.ts:41-52, 214-315`. new: `commands/_shared/generate-args.ts`.                                                                              | C-CLI-1, partial F4A-G-H-3 sibling                                 |
| 3   | **Introduce `runCliEntrypoint` helper + apply to both bins.** Replaces `void main().catch(...)` in `pattern-graph-cli.ts:271-274` and `generate-docs.ts:669-672`. Removes the `try/catch` around `RenderFormatSchema.parse` in `pattern-graph-cli.ts:134-143` to let `BoundaryParseError` propagate (unlocks `@skip` scenario at `cli-flag-parsing.feature:41-45`). | new: `commands/_shared/entrypoint.ts`. edit: both bin TS files.                                                                                           | H-CLI-Q-3, H-CLI-Q-4, L-CLI-7, partial H-CLI-T-2                   |
| 4   | **Delete `CLI_SCHEMA` / `showHelp` / `CliReferenceGenerator` from `architect-core`.** (Cross-package; cli has nothing to migrate, but landing order matters because the typecheck across the workspace must stay green.)                                                                                                                                            | core: `src/config/cli-schema.ts` (delete), `src/index.ts:237-240` (delete block).                                                                         | C-CLI-3, supersedes H-CORE-5, M-CORE-3                             |
| 5   | **Parametrize `CommandDef<TFlags>` and remove 13 flag-cast sites.** Updates `pattern-graph-cli-commands.ts` first; then 5 command modules + 2 helper modules.                                                                                                                                                                                                       | edit: `pattern-graph-cli-commands.ts` (interface widening), all `commands/*.ts`, `commands/_shared/handoff.ts`, `commands/_shared/projection-options.ts`. | H-CLI-Q-1, M-CLI-11                                                |
| 6   | **Derive `isDocError` from `DocErrorTypeSchema`** OR delete `src/index.ts` entirely. Recommend deletion (Option B in Recipe 4) — closes H-CLI-1 and H-CLI-5 simultaneously. If kept, apply Option A and update core.                                                                                                                                                | delete: `src/index.ts`, `src/cli/error-handler.ts`. edit: `package.json` (drop `main`/`module`/`types`/`.` export).                                       | H-CLI-1, H-CLI-2, H-CLI-5, H-CLI-Q-2, M-CLI-1                      |
| 7   | **Refactor `generated-docs-manifest.ts` hand-rolled validators to `z.strictObject`.** Coordinate with core's C-CORE-4 fix landing first (same recipe).                                                                                                                                                                                                              | edit: `src/cli/generated-docs-manifest.ts:6-30, 157-191`.                                                                                                 | H-CLI-6, H-CLI-Q-6                                                 |
| 8   | **Extract `loadCliConfigContext`** to deduplicate `pattern-graph-cli-runtime.ts:33-80` vs `:153-173`.                                                                                                                                                                                                                                                               | edit: `pattern-graph-cli-runtime.ts`.                                                                                                                     | H-CLI-3                                                            |
| 9   | **Inline-call `rejectLegacyCategory()`** in `pattern-graph-cli.ts:144-149`.                                                                                                                                                                                                                                                                                         | edit: `pattern-graph-cli.ts`.                                                                                                                             | H-CLI-8                                                            |
| 10  | **Cleanup:** `fileURLToPath` in `runtime-helpers.ts:30` and `runtime-bridge.js:6`; delete `tests/features/.DS_Store`; rewrite or delete the 2 aspirational `@skip` scenarios in `cli-output-formatting.feature`; fix the wording of the rules-conflict `@skip` scenario in `cli-flag-parsing.feature:49-53`.                                                        | edit + delete (cited).                                                                                                                                    | CL-CLI-M1, CL-CLI-M2, CL-CLI-L2, H-CLI-T-2 (remaining 2 scenarios) |
| 11  | **Promote `runtime-bridge.js` to workspace template.** Apply the package-name parameter generalization; copy or symlink-import from mcp and meta.                                                                                                                                                                                                                   | new pattern across packages.                                                                                                                              | Phase 1 cross-package recommendation                               |

**Why this order:**

- Steps 1–3 are mutually independent at file level but Step 2 imports from Step 1, and Step 3 unlocks the `@skip` scenario fix in Step 10. Land in sequence.
- Step 4 is cross-package (core deletion) and unblocks no cli work — but the brief asked for it; ship anytime.
- Steps 5–6 touch the same exports/types boundary; do them together to avoid double-changing `src/index.ts`.
- Step 7 follows core's C-CORE-4 fix so cli inherits the same `safeParse` recipe.
- Step 8–10 are low-risk independent cleanups; ship in any order.
- Step 11 is a separate workstream (workspace template) and should be the last cli-specific change.

**Estimated impact:**

- Net LOC change: ~−250 (deletions outweigh new shared modules ~3:1).
- `parseAtBoundary` call sites: 12 → 15+ (adds the assembled-args parses).
- Hand-rolled type witnesses: 13 → 0.
- Doctrine breaches: 1 (C-CLI-1) → 0.
- `@skip` feature scenarios: 4 → ≤2 (aspirational ones deleted; validation one unlocked by Step 3).
