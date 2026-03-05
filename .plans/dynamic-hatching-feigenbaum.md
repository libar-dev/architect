# Phase 43 — ProcessApiHybridGeneration Implementation Plan

## Context

`docs/PROCESS-API.md` has three reference tables (Global Options, Output Modifiers, List Filters) that manually duplicate CLI definitions from source code. The `showHelp()` function in `src/cli/process-api.ts` is a third copy. When CLI options change, all three locations need manual updates — creating drift risk.

Phase 43 creates a declarative CLI schema as the single source of truth, a standalone generator that produces reference tables from it, and refactors `showHelp()` to consume the same schema. The design is complete (spec at `delivery-process/specs/process-api-hybrid-generation.feature`).

---

## Implementation Steps

### Step 1: FSM Transition — roadmap → active

**File:** `delivery-process/specs/process-api-hybrid-generation.feature`

- Change `@libar-docs-status:roadmap` → `@libar-docs-status:active` (line 3)
- Must happen BEFORE any code changes (Process Guard enforcement)

---

### Step 2: Create CLI Schema (`src/cli/cli-schema.ts`)

**New file.** Declarative TypeScript constant defining all CLI options in 3 groups + session options.

**Structure:**

```typescript
interface CLIOptionDef {
  readonly flag: string; // e.g., '--input <pattern>'
  readonly short?: string; // e.g., '-i'
  readonly description: string;
  readonly default?: string; // e.g., 'cwd', 'from config or auto-detected'
  readonly valueType?: 'string' | 'number' | 'boolean' | 'enum';
  readonly repeatable?: boolean;
  readonly enumValues?: readonly string[];
}

interface CLIOptionGroup {
  readonly title: string;
  readonly description?: string; // Intro prose above table
  readonly postNote?: string; // Prose after table
  readonly options: readonly CLIOptionDef[];
}

interface CLISchema {
  readonly globalOptions: CLIOptionGroup;
  readonly outputModifiers: CLIOptionGroup;
  readonly listFilters: CLIOptionGroup;
  readonly sessionOptions: CLIOptionGroup;
}
```

**Data source:** Extract exact flag names, descriptions, and defaults from:

- `parseArgs()` in `src/cli/process-api.ts` lines 132-265
- `OutputModifiers` interface in `src/cli/output-pipeline.ts` lines 43-52
- `ListFilters` interface in `src/cli/output-pipeline.ts` lines 66-83
- Help text in `showHelp()` lines 271-413 (for descriptions/defaults)

**Inter-table prose** encoded as `description` and `postNote` fields on each group:

- `globalOptions.postNote`: Config auto-detection paragraph (from PROCESS-API.md line 391)
- `outputModifiers.description`: "Composable with list, arch context/layer..." (line 395)
- `outputModifiers.postNote`: Valid fields + precedence + summarization note (lines 405-409)
- `listFilters.description`: "For the list subcommand. All filters are composable." (line 413)

---

### Step 3: ProcessApiReferenceGenerator (`src/generators/built-in/process-api-reference-generator.ts`)

**New file.** Standalone `DocumentGenerator` that reads CLI schema and produces markdown.

**Pattern to follow:** `DecisionDocGeneratorImpl` in `src/generators/built-in/decision-doc-generator.ts` (line 874) — implements `DocumentGenerator`, registered in registry.

**Key design decisions:**

- Imports `CLI_SCHEMA` from `../cli/cli-schema.js` — does NOT use MasterDataset (ADR-006)
- Ignores `patterns` parameter (static data, not annotation-derived)
- Output path: `reference/PROCESS-API-REFERENCE.md` (relative to outputDir)
- Returns `GeneratorOutput` with single file

**Generated file structure:**

```markdown
# Process API CLI Reference

> Auto-generated from CLI schema. See [Process API Guide](../../docs/PROCESS-API.md) for usage examples.

## Global Options

{group.description}

| Flag | Short | Description | Default |
| ... |

{group.postNote}

## Output Modifiers

{group.description}

| Modifier | Description |
| ... |

{group.postNote}

## List Filters

{group.description}

| Filter | Description |
| ... |
```

**Table rendering:** Simple function that iterates `CLIOptionDef[]` and builds markdown pipe tables. No codec needed — this is direct string generation.

---

### Step 4: Register Generator

**Files to modify:**

1. **`src/generators/built-in/codec-generators.ts`** — Add import and registration:

   ```typescript
   import { createProcessApiReferenceGenerator } from './process-api-reference-generator.js';
   generatorRegistry.register(createProcessApiReferenceGenerator());
   ```

   Place after the decision doc generator section (~line 166).

2. **`delivery-process.config.ts`** — Add generator override:

   ```typescript
   'process-api-reference': {
     outputDirectory: 'docs-live',
   },
   ```

3. **`package.json`** — Add script and update `docs:all`:
   ```json
   "docs:process-api-reference": "tsx src/cli/generate-docs.ts -g process-api-reference",
   "docs:all": "... && pnpm docs:process-api-reference"
   ```

---

### Step 5: Trim PROCESS-API.md Output Reference Section

**File:** `docs/PROCESS-API.md` lines 376-424

**Replace** the Output Reference heading + 3 tables + inter-table prose (lines 376-424) with:

```markdown
---

## Output Reference

See the generated [Process API CLI Reference](../docs-live/reference/PROCESS-API-REFERENCE.md) for complete tables of global options, output modifiers, and list filters.
```

Keep everything else unchanged: JSON Envelope (line 426+), Exit Codes, JSON Piping, Common Recipes.

---

### Step 6: Refactor showHelp() to Consume CLI Schema

**File:** `src/cli/process-api.ts` lines 271-413

Replace the hardcoded Options (lines 336-343), Output Modifiers (lines 345-352), and List Filters (lines 354-363) sections with schema-driven generation:

```typescript
function formatHelpSection(group: CLIOptionGroup): string {
  return group.options
    .map((opt) => {
      const short = opt.short ? `${opt.short}, ` : '    ';
      const flag = opt.flag.padEnd(24);
      return `  ${short}${flag}${opt.description}`;
    })
    .join('\n');
}
```

**Keep hardcoded:** Subcommand listings (Session Workflow, Pattern Discovery, Architecture Queries, Metadata, Common Recipes, Available API Methods) — these are editorial content not in the schema.

**Only replace:** The 3 tabular sections that duplicate schema data.

---

### Step 7: Behavior Spec + Tests

**New feature file:** `tests/features/behavior/cli/process-api-reference.feature`

**Note:** The spec says `tests/features/behavior/cli/` but existing CLI tests are in `tests/features/cli/`. Need to check which convention to follow — the spec says `tests/features/behavior/cli/` so create the directory if needed, or place in `tests/features/cli/` if that's the established convention.

**Scenarios to cover:**

1. CLI schema defines all option groups (globalOptions, outputModifiers, listFilters)
2. Generated PROCESS-API-REFERENCE.md contains 3 markdown tables
3. Table headers match expected columns
4. Inter-table prose included
5. Sync test: parseArgs flags match schema entries

**New step file:** `tests/steps/cli/process-api-reference.steps.ts` (or `tests/steps/behavior/cli/...`)

**Sync test approach:**

- Extract flag names from `parseArgs()` by calling it with `--help` and parsing output, OR
- Import CLI schema and verify each schema entry's flag exists in parseArgs switch/if logic
- Simplest: import both `CLI_SCHEMA` and call `parseArgs()` with each flag to verify it's recognized (no "Unknown option" error)

---

### Step 8: FSM Transition — active → completed

**File:** `delivery-process/specs/process-api-hybrid-generation.feature`

- Mark all 7 deliverables as `complete` in the Background table
- Change `@libar-docs-status:active` → `@libar-docs-status:completed`

---

### Step 9: Regenerate + Test + Commit

```bash
pnpm build && pnpm docs:all && pnpm test
```

Update tracker at `.plans/docs-consolidation-tracker.md` with session report.

---

## Files Summary

| Action    | File                                                           | Purpose                                         |
| --------- | -------------------------------------------------------------- | ----------------------------------------------- |
| Create    | `src/cli/cli-schema.ts`                                        | Declarative CLI schema (single source of truth) |
| Create    | `src/generators/built-in/process-api-reference-generator.ts`   | Standalone generator                            |
| Create    | `tests/features/cli/process-api-reference.feature`             | Behavior spec                                   |
| Create    | `tests/steps/cli/process-api-reference.steps.ts`               | Step definitions                                |
| Modify    | `src/cli/process-api.ts`                                       | Refactor showHelp() to use schema               |
| Modify    | `src/generators/built-in/codec-generators.ts`                  | Register generator                              |
| Modify    | `delivery-process.config.ts`                                   | Add generator override                          |
| Modify    | `package.json`                                                 | Add docs script + update docs:all               |
| Modify    | `docs/PROCESS-API.md`                                          | Trim Output Reference to link                   |
| Modify    | `delivery-process/specs/process-api-hybrid-generation.feature` | FSM transitions + deliverables                  |
| Modify    | `.plans/docs-consolidation-tracker.md`                         | Session report                                  |
| Generated | `docs-live/reference/PROCESS-API-REFERENCE.md`                 | Output file                                     |

## Existing Code to Reuse

- `DocumentGenerator` interface: `src/generators/types.ts` lines 34-52
- `GeneratorOutput` / `OutputFile`: `src/generators/types.ts` lines 101-119
- `generatorRegistry`: `src/generators/registry.ts` line 87
- `DecisionDocGeneratorImpl` pattern: `src/generators/built-in/decision-doc-generator.ts` line 874
- `OutputModifiers` / `ListFilters` interfaces: `src/cli/output-pipeline.ts` lines 43-83

## Verification

1. `pnpm build` — TypeScript compiles without errors
2. `pnpm docs:process-api-reference` — generates `docs-live/reference/PROCESS-API-REFERENCE.md`
3. `pnpm docs:all` — full generation pipeline succeeds
4. `pnpm test` — all tests pass including new behavior spec
5. Manual check: `docs-live/reference/PROCESS-API-REFERENCE.md` contains 3 tables with correct data
6. Manual check: `docs/PROCESS-API.md` Output Reference section has link, no inline tables
7. `pnpm process:query -- --help` — help text shows schema-driven options sections
