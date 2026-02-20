# OrchestratorPipelineFactoryMigration

**Purpose:** Detailed patterns for OrchestratorPipelineFactoryMigration

---

## Summary

**Progress:** [██████████░░░░░░░░░░] 1/2 (50%)

| Status | Count |
| --- | --- |
| ✅ Completed | 1 |
| 🚧 Active | 0 |
| 📋 Planned | 1 |
| **Total** | 2 |

---

## 📋 Planned Patterns

### 📋 Cli Behavior Testing

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 3d |
| Business Value | ensure cli commands work correctly with all argument combinations |

**Problem:**
  All 5 CLI commands (generate-docs, lint-patterns, lint-process, validate-patterns,
  generate-tag-taxonomy) have zero behavior specs. These are user-facing interfaces
  that need comprehensive testing for argument parsing, error handling, and output formats.

  **Solution:**
  Create behavior specs for each CLI command covering:
  - Argument parsing (all flags and combinations)
  - Error handling (missing/invalid input)
  - Output format validation (JSON, pretty)
  - Exit code behavior

  **Business Value:**
  | Benefit | How |
  | Reliability | CLI commands work correctly in all scenarios |
  | User Experience | Clear error messages for invalid usage |
  | CI/CD Integration | Predictable exit codes for automation |

#### Dependencies

- Depends on: ADR002GherkinOnlyTesting

#### Acceptance Criteria

**Generate specific document type**

- Given TypeScript files with @libar-docs annotations
- And feature files with pattern metadata
- When running "generate-docs -g patterns -o docs"
- Then PATTERNS.md is created in docs directory
- And exit code is 0

**Generate multiple document types**

- Given source files with pattern metadata
- When running "generate-docs -g patterns,roadmap,remaining -o docs"
- Then PATTERNS.md, ROADMAP.md, and REMAINING-WORK.md are created
- And exit code is 0

**Unknown generator name fails with helpful error**

- Given source files with pattern metadata
- When running "generate-docs -g invalid-generator -o docs"
- Then exit code is 1
- And error message contains "Unknown generator: invalid-generator"
- And available generators are listed

**Missing required input fails with usage hint**

- When running "generate-docs -g patterns"
- Then exit code is 1
- And error message contains "missing required"

**Lint passes for valid annotations**

- Given TypeScript files with complete @libar-docs annotations
- When running "lint-patterns -i 'src/**/*.ts'"
- Then exit code is 0
- And output indicates "No violations found"

**Lint fails for missing pattern name**

- Given TypeScript file with @libar-docs but no @libar-docs-pattern
- When running "lint-patterns -i 'src/**/*.ts'"
- Then exit code is 1
- And output contains "missingPatternName" violation

**JSON output format**

- Given TypeScript files with lint violations
- When running "lint-patterns -i 'src/**/*.ts' --format json"
- Then output is valid JSON
- And JSON includes violations array with severity, message, file, line

**Strict mode treats warnings as errors**

- Given TypeScript files with warning-level violations only
- When running "lint-patterns -i 'src/**/*.ts' --strict"
- Then exit code is 1

**DoD validation for specific phase**

- Given feature files with phase 15 deliverables
- When running "validate-patterns --dod --phase 15"
- Then output shows DoD completion for phase 15
- And deliverable status is summarized

**Anti-pattern detection**

- Given feature files with scenario bloat (>15 scenarios)
- When running "validate-patterns --anti-patterns"
- Then output includes "scenarioBloat" violation
- And affected feature files are listed

**Combined validation modes**

- When running "validate-patterns --dod --anti-patterns"
- Then both DoD and anti-pattern results are shown
- And exit code reflects combined status

**File not found error includes path**

- When running "generate-docs -i 'nonexistent/**/*.ts' -g patterns -o docs"
- Then error message contains file path
- And exit code is 1

**Parse error includes line number**

- Given TypeScript file with invalid JSDoc syntax
- When running "lint-patterns -i 'src/**/*.ts'"
- Then error includes file path and line number

#### Business Rules

**generate-docs handles all argument combinations correctly**

**Invariant:** Invalid arguments produce clear error messages with usage hints.
    Valid arguments produce expected output files.

    **API:** See `src/cli/generate-docs.ts`

    **Verified by:** Argument parsing, Generator selection, Output file creation

_Verified by: Generate specific document type, Generate multiple document types, Unknown generator name fails with helpful error, Missing required input fails with usage hint_

**lint-patterns validates annotation quality with configurable strictness**

**Invariant:** Lint violations are reported with file, line, and severity.
    Exit codes reflect violation presence based on strictness setting.

    **API:** See `src/cli/lint-patterns.ts`

    **Verified by:** Lint execution, Strict mode, Output formats

_Verified by: Lint passes for valid annotations, Lint fails for missing pattern name, JSON output format, Strict mode treats warnings as errors_

**validate-patterns performs cross-source validation with DoD checks**

**Invariant:** DoD and anti-pattern violations are reported per phase.
    Exit codes reflect validation state.

    **API:** See `src/cli/validate-patterns.ts`

    **Verified by:** DoD validation, Anti-pattern detection, Phase filtering

_Verified by: DoD validation for specific phase, Anti-pattern detection, Combined validation modes_

**All CLIs handle errors consistently with DocError pattern**

**Invariant:** Errors include type, file, line (when applicable), and reason.
    Unknown errors are caught and formatted safely.

    **Verified by:** Error formatting, Unknown error handling

_Verified by: File not found error includes path, Parse error includes line number_

---

## ✅ Completed Patterns

### ✅ Orchestrator Pipeline Factory Migration

| Property | Value |
| --- | --- |
| Status | completed |
| Effort | 2d |
| Business Value | eliminate last parallel pipeline and unify pipeline definition |

**Problem:**
  `orchestrator.ts` is the last feature consumer that wires the 8-step
  scan-extract-merge-transform pipeline inline (lines 282-427). This is
  the Parallel Pipeline anti-pattern identified in ADR-006. The shared
  pipeline factory in `build-pipeline.ts` already serves `process-api.ts`
  and `validate-patterns.ts`, but the orchestrator — the original pipeline
  host — was deferred (ProcessAPILayeredExtraction DD-3) because it
  collects structured warnings (scan errors with file details, extraction
  error counts, Gherkin parse errors with line/column) that the factory's
  flat `readonly string[]` warnings cannot represent.

  **Current violations in orchestrator.ts:**

  | Anti-Pattern | Location | Evidence |
  | Parallel Pipeline | Lines 282-427 | 8-step pipeline: loadConfig, scanPatterns, extractPatterns, scanGherkinFiles, extractPatternsFromGherkin, mergePatterns, computeHierarchyChildren, transformToMasterDataset |

  Additionally, `mergePatterns()` is defined in orchestrator.ts (line 701)
  but imported by `build-pipeline.ts` from `../orchestrator.js`. This
  creates a misplaced-dependency: the factory depends on the consumer it
  is meant to replace. When the orchestrator migrates to the factory, the
  import direction inverts correctly.

  **What the orchestrator does beyond the pipeline:**

  | Responsibility | Lines | Stays in orchestrator |
  | Pipeline (steps 1-8) | 282-427 | No — delegates to factory |
  | PR Changes git detection | 429-469 | Yes — generator-specific option |
  | Generator dispatch + file writing | 471-645 | Yes — core orchestrator job |
  | Session file cleanup | 647-679 | Yes — post-generation lifecycle |
  | mergePatterns utility | 701-727 | No — moves to pipeline/ |
  | cleanupOrphanedSessionFiles | 761-809 | Yes — lifecycle utility |
  | generateFromConfig | 922-998 | Yes — config-based entry point |
  | groupGenerators, mergeGenerateResults | 850-898 | Yes — batching utilities |

  **Solution:**
  Enrich the pipeline factory's `PipelineResult` with structured warnings
  that capture the granularity the orchestrator needs, then migrate
  `generateDocumentation()` to call `buildMasterDataset()`. Move
  `mergePatterns()` to `src/generators/pipeline/merge-patterns.ts` as a
  standalone pipeline step.

  The orchestrator retains: generator dispatch, file writing, PR-changes
  detection, codec option assembly, session cleanup, and the
  `generateFromConfig` entry point.

  **Design Decisions:**

  DD-1: Structured warnings replace flat strings in PipelineResult.
  The factory's `PipelineResult.warnings` changes from `readonly string[]`
  to `readonly PipelineWarning[]` where `PipelineWarning` is:

  See PipelineWarning and PipelineWarningDetail interfaces in
  src/generators/pipeline/build-pipeline.ts. PipelineWarning has a
  discriminated type field ('scan' | 'extraction' | 'gherkin-parse'),
  a message, optional count, and optional details array.

  This is structurally similar to `GenerationWarning` + `WarningDetail`
  from orchestrator.ts. The orchestrator maps `PipelineWarning` to
  `GenerationWarning` in a thin adapter — `'gherkin-parse'` maps to
  `'scan'`, and generator-level warning types (`'overwrite-skipped'`,
  `'config'`, `'cleanup'`) are produced by the orchestrator itself, not
  the pipeline. Existing consumers (process-api, validate-patterns) that
  ignore warnings or use flat strings are unaffected — they can read
  `.message` only.

  DD-2: mergePatterns moves to src/generators/pipeline/merge-patterns.ts.
  Currently defined in orchestrator.ts (line 701), imported by
  build-pipeline.ts. After the move:
  - `build-pipeline.ts` imports from `./merge-patterns.js` (sibling)
  - `orchestrator.ts` no longer exports `mergePatterns`
  - `generators/index.ts` re-exports from `pipeline/merge-patterns.js`
  - The public API (`mergePatterns`) stays available, just moves home

  DD-3: Pipeline factory gains an includeValidation option.
  The orchestrator calls `transformToMasterDataset` (no validation),
  while process-api calls `transformToMasterDatasetWithValidation`.
  The factory already calls the validation variant. Adding
  `includeValidation?: boolean` (default true) lets the orchestrator
  opt out, since doc generation doesn't need validation summaries.
  This was foreshadowed in ProcessAPILayeredExtraction DD-3.

  DD-4: Scan result counts flow through PipelineResult.
  The orchestrator needs scan result counts for constructing its warning
  messages: how many files were scanned, how many had errors, how many
  had skipped directives, how many Gherkin files had parse errors. The
  factory adds an optional `scanMetadata` field:

  See ScanMetadata interface in src/generators/pipeline/build-pipeline.ts.
  It carries scannedFileCount, scanErrorCount, skippedDirectiveCount,
  and gherkinErrorCount.

  This avoids exposing raw `ScannedFile[]` (which would be a Parallel
  Pipeline enabler) while providing the counts the orchestrator needs
  for its warning messages. The merged patterns array for
  `GenerateResult.patterns` and generator context comes from
  `PipelineResult.dataset.patterns`, not from scan metadata.

  DD-5: The factory supports partial success for scan errors.
  Today the factory returns `Result.err` on total scanner failure
  (e.g., invalid glob), which remains unchanged — total infrastructure
  failures are always fatal. For partial failures (individual files
  with parse errors within an otherwise successful scan), the new
  `failOnScanErrors?: boolean` option controls behavior. When true
  (default for process-api), partial scan errors produce `Result.err`.
  When false (orchestrator), partial errors are captured in
  `PipelineResult.warnings` as structured `PipelineWarning` objects
  and the pipeline continues with successfully scanned files.

  DD-6: generateDocumentation signature is unchanged.
  The public `GenerateOptions` and `GenerateResult` interfaces don't
  change. The orchestrator's `generateDocumentation()` becomes a thinner
  function: build PipelineOptions from GenerateOptions, call factory,
  map PipelineWarnings to GenerationWarnings, then proceed with generator
  dispatch. The programmatic API is stable. The orchestrator's config
  loading (`loadConfig`) is replaced by the factory's internal config
  step — `tagRegistry` is accessed via `dataset.tagRegistry`. The merged
  patterns array for `GenerateResult.patterns` and generator context is
  `dataset.patterns` from the MasterDataset.

  DD-7: validate-patterns.ts and process-api.ts are unaffected.
  They already consume the factory. The only change they see is
  `PipelineResult.warnings` widening from `readonly string[]` to
  `readonly PipelineWarning[]`, which is backward-compatible (they
  currently ignore or stringify warnings).

  **Implementation Order:**

  | Step | What | Verification |
  | 1 | Move mergePatterns to src/generators/pipeline/merge-patterns.ts | pnpm typecheck |
  | 2 | Update imports in build-pipeline.ts, orchestrator.ts, generators/index.ts, orchestrator.steps.ts | pnpm typecheck, pnpm lint |
  | 3 | Add PipelineWarning types to build-pipeline.ts | pnpm typecheck |
  | 4 | Enrich factory to collect structured warnings and scan metadata | pnpm typecheck |
  | 5 | Add includeValidation and failOnScanErrors options to factory | pnpm typecheck |
  | 6 | Migrate generateDocumentation pipeline to factory call | pnpm build, pnpm test |
  | 7 | Remove unused scanner/extractor imports from orchestrator.ts | pnpm lint |
  | 8 | Full verification | pnpm build, pnpm test, pnpm lint, pnpm validate:patterns, pnpm docs:all |

  **Files Modified:**

  | File | Change | Lines Affected |
  | src/generators/pipeline/merge-patterns.ts | NEW: mergePatterns moved from orchestrator | +~30 |
  | src/generators/pipeline/build-pipeline.ts | Enrich PipelineResult, add options, collect warnings | +~60 |
  | src/generators/pipeline/index.ts | Re-export merge-patterns | +2 |
  | src/generators/orchestrator.ts | Replace pipeline with factory call, remove mergePatterns | -~170 net |
  | src/generators/index.ts | Update mergePatterns re-export source | ~2 |
  | tests/steps/generators/orchestrator.steps.ts | Update mergePatterns import to pipeline/merge-patterns | ~1 |

  **What does NOT change:**

  - GenerateOptions, GenerateResult, GeneratedFile interfaces (stable public API)
  - Generator dispatch, file writing, PR-changes detection (orchestrator core)
  - Session cleanup, generateFromConfig, groupGenerators (orchestrator utilities)
  - generate-docs CLI (calls generateDocumentation unchanged)
  - process-api.ts, validate-patterns.ts (already migrated)
  - Existing test scenarios for orchestrator (same observable behavior)

#### Dependencies

- Depends on: ProcessAPILayeredExtraction

#### Acceptance Criteria

**No pipeline imports in orchestrator**

- Given the refactored orchestrator.ts
- When inspecting import statements
- Then no imports from scanner/ exist (except type imports)
- And no imports from extractor/ exist (except type imports)
- And the scanPatterns function is not called
- And the extractPatterns function is not called

**Factory is sole pipeline definition**

- Given the three CLI consumers: process-api, validate-patterns, orchestrator
- When each needs a MasterDataset
- Then each calls buildMasterDataset from build-pipeline.ts
- And no consumer wires the 8-step pipeline inline

**mergePatterns location**

- Given the refactored codebase
- When inspecting src/generators/pipeline/merge-patterns.ts
- Then mergePatterns is defined and exported there
- And build-pipeline.ts imports it from ./merge-patterns.js
- And orchestrator.ts does not define or export mergePatterns

**Public API preserved**

- Given the generators barrel export in generators/index.ts
- When inspecting mergePatterns re-export
- Then mergePatterns is re-exported (from pipeline module)
- And existing callers of mergePatterns compile without changes

**Orchestrator warnings preserved**

- Given a codebase with scan errors and Gherkin parse failures
- When generateDocumentation runs via the factory
- Then GenerationWarnings include scan error counts
- And GenerationWarnings include Gherkin parse error details with file, line, column
- And the warning output is identical to pre-refactor behavior

**Existing consumers unaffected**

- Given process-api.ts and validate-patterns.ts consuming the factory
- When PipelineResult.warnings changes from string[] to PipelineWarning[]
- Then both consumers compile without changes
- And runtime behavior is unchanged

**Partial success mode works**

- Given a codebase where 1 of 10 TypeScript files has a syntax error
- When the factory runs with failOnScanErrors false
- Then the result is Result.ok with 9 patterns
- And warnings include the scan error for the failing file
- And the pipeline does not return Result.err

**Full verification passes**

- Given the complete refactored codebase
- When running pnpm build, pnpm test, pnpm lint, and pnpm validate:patterns
- Then all pass with zero errors
- And pnpm docs:all produces identical output to pre-refactor

#### Business Rules

**Orchestrator delegates pipeline to factory**

**Invariant:** `generateDocumentation()` calls `buildMasterDataset()`
    for the scan-extract-merge-transform sequence. It does not import
    from `scanner/` or `extractor/` for pipeline orchestration. Direct
    imports are permitted only for types used in GenerateResult (e.g.,
    `ExtractedPattern`).

    **Rationale:** The orchestrator is the original host of the inline
    pipeline. After this migration, the pipeline factory is the sole
    definition of the 8-step sequence. Any future changes to pipeline
    steps (adding caching, parallel scanning, incremental extraction)
    happen in one place and all consumers benefit.

    **Verified by:** No pipeline imports in orchestrator, Factory is sole pipeline definition

_Verified by: No pipeline imports in orchestrator, Factory is sole pipeline definition_

**mergePatterns lives in pipeline module**

**Invariant:** The `mergePatterns()` function lives in
    `src/generators/pipeline/merge-patterns.ts` as a pipeline step. It is
    not defined in consumer code (orchestrator or CLI files).

    **Rationale:** `mergePatterns` is step 5 of the 8-step pipeline. It
    was defined in orchestrator.ts for historical reasons (the
    orchestrator was the first pipeline host). Now that the pipeline
    factory exists, the function belongs alongside other pipeline steps
    (scan, extract, transform). The public API re-export in
    `generators/index.ts` preserves backward compatibility.

    **Verified by:** mergePatterns location, Public API preserved

_Verified by: mergePatterns location, Public API preserved_

**Factory provides structured warnings for all consumers**

**Invariant:** `PipelineResult.warnings` contains typed warning
    objects with `type`, `message`, optional `count`, and optional
    `details` (file, line, column, message). Consumers that need
    granular diagnostics (orchestrator) use the full structure. Consumers
    that need simple messages (process-api) read `.message` only.

    **Rationale:** The orchestrator collects scan errors, skipped
    directives, extraction errors, and Gherkin parse errors as structured
    `GenerationWarning` objects. The factory must provide equivalent
    structure to eliminate the orchestrator's need to run the pipeline
    directly. The `PipelineWarning` type is structurally similar to
    `GenerationWarning` to minimize mapping complexity.

    **Verified by:** Orchestrator warnings preserved, Existing consumers unaffected

_Verified by: Orchestrator warnings preserved, Existing consumers unaffected_

**Pipeline factory supports partial success mode**

**Invariant:** When `failOnScanErrors` is false, the factory captures
    scan errors and extraction errors as warnings and continues with
    successfully processed files. When true (default), the factory returns
    `Result.err` on the first scan failure.

    **Rationale:** The orchestrator treats scan errors as non-fatal
    warnings — documentation generation should succeed for all scannable
    files even if some files have syntax errors. The process-api treats
    scan errors as fatal because the query layer requires a complete
    dataset. The factory must support both strategies via configuration.

    **Verified by:** Partial success mode works

_Verified by: Partial success mode works_

**End-to-end verification confirms behavioral equivalence**

**Invariant:** After migration, all CLI commands and doc generation
    produce identical output to pre-refactor behavior.

    **Rationale:** The migration must not change observable behavior for any
    consumer. Full verification confirms the factory migration is a pure refactor.

    **Verified by:** Full verification passes

_Verified by: Full verification passes_

---

[← Back to Roadmap](../ROADMAP.md)
