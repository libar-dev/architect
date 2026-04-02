@architect
@architect-pattern:PatternGraphLayeredExtraction
@architect-status:completed
@architect-unlock-reason:PR28-review-structural-fixes
@architect-phase:100
@architect-effort:2d
@architect-product-area:DataAPI
@architect-include:process-workflow
@architect-depends-on:ValidatorReadModelConsolidation
@architect-business-value:separate-cli-shell-from-domain-logic-in-pattern-graph-cli
@architect-priority:high
Feature: Pattern Graph Layered Extraction

  **Problem:**
  `pattern-graph-cli.ts` is 1,700 lines containing two remaining architectural
  violations of ADR-006:

  1. **Parallel Pipeline**: `buildPipeline()` (lines 488-561) wires the
     same 8-step scan-extract-transform sequence that `validate-patterns.ts`
     and `orchestrator.ts` also wire independently. Three consumers, three
     copies of identical pipeline orchestration code.

  2. **Inline Domain Logic**: `handleRules()` (lines 1096-1279, 184 lines)
     builds nested `Map` hierarchies (area -> phase -> feature -> rules),
     parses business rule annotations via codec-layer imports
     (`parseBusinessRuleAnnotations`, `deduplicateScenarioNames`), and
     computes aggregate statistics. This is query logic that belongs in the
     API layer, not the CLI file.

  Most subcommand handlers already delegate correctly. Of the 16 handlers
  in pattern-graph-cli.ts, 13 are thin wrappers over `src/api/` modules:

  | Handler | Delegates To |
  | handleStatus | PatternGraphAPI methods |
  | handleQuery | Dynamic API method dispatch |
  | handlePattern | PatternGraphAPI methods |
  | handleList | output-pipeline.ts |
  | handleSearch | fuzzy-match.ts, pattern-helpers.ts |
  | handleStubs | stub-resolver.ts |
  | handleDecisions | stub-resolver.ts, pattern-helpers.ts |
  | handlePdr | stub-resolver.ts |
  | handleContext | context-assembler.ts, context-formatter.ts |
  | handleFiles | context-assembler.ts, context-formatter.ts |
  | handleDepTreeCmd | context-assembler.ts, context-formatter.ts |
  | handleOverviewCmd | context-assembler.ts, context-formatter.ts |
  | handleScopeValidate | scope-validator.ts |

  The remaining violations are:

  | Handler | Issue | Lines |
  | handleRules | Inline domain logic: nested Maps, codec imports | 184 |
  | handleArch | Partial: 6 sub-handlers delegate, 3 have trivial inline projections | 121 |
  | buildPipeline | Parallel Pipeline: duplicates 8-step sequence | 74 |

  **Solution:**
  Extract the two remaining violations into their proper layers:

  | Layer | Extraction | Location |
  | Pipeline Factory | Shared scan-extract-transform sequence from buildPipeline | src/generators/pipeline/build-pipeline.ts |
  | Query Handler | Business rules domain logic from handleRules | src/api/rules-query.ts |

  The CLI retains its routing responsibility: parse args, call pipeline
  factory, route subcommand to API module, format output.

  **Design Decisions:**

  DD-1: Pipeline factory location and return type.
  Location: `src/generators/pipeline/build-pipeline.ts`, re-exported from
  `src/generators/pipeline/index.ts`. The factory returns
  `Result<PipelineResult, PipelineError>` so each consumer can map errors
  to its own strategy (pattern-graph-cli calls `process.exit(1)`,
  validate-patterns throws, orchestrator returns `Result.err()`).
  `PipelineResult` contains `{ dataset: RuntimePatternGraph, validation:
  ValidationSummary }`. The `TagRegistry` is accessible via
  `dataset.tagRegistry` and does not need a separate field.

  DD-2: Merge conflict strategy as a pipeline option.
  The factory accepts `mergeConflictStrategy: 'fatal' | 'concatenate'`.
  `'fatal'` returns `Result.err()` on conflicts (pattern-graph-cli behavior).
  `'concatenate'` falls back to `[...ts, ...gherkin]` (validate-patterns
  behavior per DD-1 in ValidatorReadModelConsolidation). This is the most
  significant semantic difference between consumers.

  DD-3: Factory interface designed for future orchestrator migration.
  The `PipelineOptions` interface includes `exclude`, `contextInferenceRules`,
  and `includeValidation` fields that orchestrator.ts needs. However, the
  actual orchestrator migration is deferred to a follow-up spec. The
  orchestrator has 155 lines of pipeline with structured warning collection
  (scan errors, extraction errors, Gherkin parse errors as
  `GenerationWarning[]`). Integrating this into the factory adds risk to a
  first extraction. This spec migrates pattern-graph-cli.ts and
  validate-patterns.ts only.

  DD-4: handleRules domain logic extracts to `src/api/rules-query.ts`.
  The new module exports `queryBusinessRules(dataset: RuntimePatternGraph,
  filters: RulesFilters): RulesQueryResult`. The `RulesFilters` interface,
  `RuleOutput` interface, and all nested Map construction move to this module.
  The `parseBusinessRuleAnnotations` and `deduplicateScenarioNames` imports
  move from CLI to API layer, which is the correct placement per ADR-006.
  The CLI handler becomes: parse filters from args, call
  `queryBusinessRules`, apply output modifiers, return.

  DD-5: handleStubs, handleDecisions, handlePdr already delegate correctly.
  These handlers are thin CLI wrappers over `stub-resolver.ts` functions
  (`findStubPatterns`, `resolveStubs`, `groupStubsByPattern`,
  `extractDecisionItems`, `findPdrReferences`). The residual CLI code is
  argument parsing and error formatting, which is CLI-shell responsibility.
  No extraction needed. The original deliverables are marked n/a.

  DD-6: handleArch inline logic stays in CLI.
  The `roles`, `context`, and `layer` listing sub-handlers have 3-5 line
  `.map()` projections over `archIndex` pre-computed views. These are trivial
  view formatting, not domain logic. The `dangling`, `orphans`, `blocking`,
  `neighborhood`, `compare`, and `coverage` sub-handlers already delegate
  to `arch-queries.ts` and `context-assembler.ts`. Extracting 3-line `.map()`
  calls would add indirection with no architectural benefit.

  DD-7: validate-patterns.ts partially adopts the pipeline factory.
  The factory replaces the PatternGraph construction pipeline (steps 1-8).
  DoD validation and anti-pattern detection remain as direct stage-1
  consumers using raw scanned files (`scanResult.value.files`,
  `gherkinScanResult.value.files`). This is correct per ADR-006: the
  exception for `lint-patterns.ts` ("pure stage-1 consumer, no
  relationships, no cross-source resolution, direct scanner consumption is
  correct") applies equally to DoD validation (checking deliverable
  completeness on raw Gherkin) and anti-pattern detection (checking tag
  placement on raw scanned files).

  DD-8: Line count invariant replaced with qualitative criterion.
  The original 500-line target for pattern-graph-cli.ts is unrealistic. After
  extracting buildPipeline (74 lines) and handleRules (184 lines), the
  file is ~1,400 lines. The remaining code is legitimate CLI responsibility:
  parseArgs (134), showHelp (143), routeSubcommand (96), main (59), 13 thin
  delegation handlers (~350), config defaults (50), types (60), imports (120).
  Reaching 500 lines would require extracting arg parsing and help text to
  separate files, which is file hygiene, not architectural layering.
  The invariant becomes: no Map/Set construction in handler functions, each
  domain query delegates to an `src/api/` module.

  **Implementation Order:**

  | Step | What | Verification |
  | 1 | Create src/generators/pipeline/build-pipeline.ts with PipelineOptions and factory | pnpm typecheck |
  | 2 | Export from src/generators/pipeline/index.ts barrel | pnpm typecheck |
  | 3 | Migrate pattern-graph-cli.ts buildPipeline to factory call | pnpm typecheck, pnpm process:query -- overview |
  | 4 | Remove unused scanner/extractor imports from pattern-graph-cli.ts | pnpm lint |
  | 5 | Migrate validate-patterns.ts PatternGraph pipeline to factory call | pnpm validate:patterns (0 errors, 0 warnings) |
  | 6 | Create src/api/rules-query.ts with queryBusinessRules | pnpm typecheck |
  | 7 | Slim handleRules in pattern-graph-cli.ts to thin delegation | pnpm process:query -- rules |
  | 8 | Export from src/api/index.ts barrel | pnpm typecheck |
  | 9 | Full verification | pnpm build, pnpm test, pnpm lint, pnpm validate:patterns |

  **Files Modified:**

  | File | Change | Lines Affected |
  | src/generators/pipeline/build-pipeline.ts | NEW: shared pipeline factory | +~100 |
  | src/generators/pipeline/index.ts | Add re-export of build-pipeline | +2 |
  | src/api/rules-query.ts | NEW: business rules query from handleRules | +~200 |
  | src/api/index.ts | Add re-exports for rules-query | +5 |
  | src/cli/pattern-graph-cli.ts | Replace buildPipeline + handleRules with delegations | -~280 net |
  | src/cli/validate-patterns.ts | Replace PatternGraph pipeline with factory call | -~30 net |

  **What does NOT change:**

  - parseArgs(), showHelp(), routeSubcommand(), main() (CLI shell)
  - handleArch inline logic (trivial projections per DD-6)
  - handleStubs/handleDecisions/handlePdr (already delegate per DD-5)
  - generateEmptyHint (UX concern, correctly in CLI)
  - DoD validation and anti-pattern detection in validate-patterns.ts (stage-1 consumers per DD-7)
  - orchestrator.ts pipeline wiring (deferred per DD-3)
  - parseListFilters, parseRulesFilters (arg parsing, not domain logic)
  - ValidationIssue, ValidationSummary, ValidateCLIConfig (stable API in validate-patterns)

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Create shared pipeline factory | complete | src/generators/pipeline/build-pipeline.ts |
      | pattern-graph-cli.ts consumes pipeline factory | complete | src/cli/pattern-graph-cli.ts |
      | validate-patterns.ts consumes pipeline factory (PatternGraph only) | complete | src/cli/validate-patterns.ts |
      | Extract handleRules to rules-query.ts | complete | src/api/rules-query.ts |
      | Update barrel exports | complete | src/api/index.ts, src/generators/pipeline/index.ts |
      | End-to-end verification | complete | CLI output |

  Rule: CLI file contains only routing, no domain logic

    **Invariant:** `pattern-graph-cli.ts` parses arguments, calls the pipeline
    factory for the PatternGraph, routes subcommands to API modules, and
    formats output. It does not build Maps, filter patterns, group data,
    or resolve relationships. Thin view projections (3-5 line `.map()`
    calls over pre-computed archIndex views) are acceptable as formatting.

    **Rationale:** Domain logic in the CLI file is only accessible via the
    command line. Extracting it to `src/api/` makes it programmatically
    testable, reusable by future consumers (MCP server, watch mode), and
    aligned with the feature-consumption layer defined in ADR-006.

    **Verified by:** No domain data structures in handlers, All domain queries delegate

    @acceptance-criteria
    Scenario: No domain data structures in handlers
      Given the refactored pattern-graph-cli.ts
      When inspecting handler functions
      Then no Map or Set construction exists for domain data grouping
      And no imports from renderable/codecs/ exist in the CLI file
      And each subcommand with domain logic delegates to an src/api/ module

    @acceptance-criteria
    Scenario: All domain queries delegate
      Given handleRules business rules grouping
      When extracted to src/api/rules-query.ts
      Then the CLI handler parses filters, calls queryBusinessRules, and formats output
      And the queryBusinessRules function is a pure function taking RuntimePatternGraph
      And the nested Map construction lives in rules-query.ts, not pattern-graph-cli.ts

  Rule: Pipeline factory is shared across CLI consumers

    **Invariant:** The scan-extract-transform sequence is defined once in
    `src/generators/pipeline/build-pipeline.ts`. CLI consumers that need a
    PatternGraph call the factory rather than wiring the pipeline
    independently. The factory accepts `mergeConflictStrategy` to handle
    behavioral differences between consumers.

    **Rationale:** Three consumers (pattern-graph-cli, validate-patterns,
    orchestrator) independently wire the same 8-step sequence: loadConfig,
    scanPatterns, extractPatterns, scanGherkinFiles,
    extractPatternsFromGherkin, mergePatterns, computeHierarchyChildren,
    transformToPatternGraph. The only semantic difference is merge-conflict
    handling (fatal vs concatenate). This is a Parallel Pipeline anti-pattern
    per ADR-006.

    **Verified by:** CLI consumers use factory, Orchestrator migration deferred

    @acceptance-criteria
    Scenario: CLI consumers use factory
      Given pattern-graph-cli.ts and validate-patterns.ts
      When each needs a PatternGraph
      Then each calls the shared pipeline factory from build-pipeline.ts
      And pattern-graph-cli.ts does not import from scanner/ or extractor/
      And validate-patterns.ts uses the factory for PatternGraph but retains direct scans for DoD and anti-patterns

    @acceptance-criteria
    Scenario: Orchestrator migration deferred
      Given the pipeline factory interface
      When inspecting PipelineOptions
      Then it includes exclude, contextInferenceRules, and includeValidation fields
      And orchestrator.ts is not yet migrated (follow-up spec)
      And the factory API surface supports orchestrator migration without breaking changes

  Rule: Domain logic lives in API modules

    **Invariant:** Query logic that operates on PatternGraph lives in
    `src/api/` modules. The `rules-query.ts` module provides business rules
    querying with the same grouping logic that was inline in handleRules:
    filter by product area and pattern, group by area -> phase -> feature ->
    rules, parse annotations, compute totals.

    **Rationale:** `handleRules` is 184 lines with 5 Map/Set constructions,
    codec-layer imports (`parseBusinessRuleAnnotations`,
    `deduplicateScenarioNames`), and a complex 3-level grouping algorithm.
    This is the last significant inline domain logic in pattern-graph-cli.ts.
    Moving it to `src/api/` follows the same pattern as the 12 existing API
    modules (context-assembler, arch-queries, scope-validator, etc.).

    **Verified by:** rules-query module exports, handleRules slim wrapper

    @acceptance-criteria
    Scenario: rules-query module exports
      Given the new src/api/rules-query.ts
      When inspecting the module
      Then it exports queryBusinessRules taking RuntimePatternGraph and RulesFilters
      And it exports RulesQueryResult, RulesFilters, and RuleOutput types
      And it is re-exported from src/api/index.ts

    @acceptance-criteria
    Scenario: handleRules slim wrapper
      Given the refactored handleRules in pattern-graph-cli.ts
      When inspecting the function
      Then it parses filters from CLI sub-args
      And calls queryBusinessRules for the domain result
      And applies output modifiers (count, namesOnly) on the result
      And contains no Map or Set construction

  Rule: Pipeline factory returns Result for consumer-owned error handling

    **Invariant:** The factory returns `Result<PipelineResult, PipelineError>`
    rather than throwing or calling `process.exit()`. Each consumer maps the
    error to its own strategy: pattern-graph-cli.ts calls `process.exit(1)`,
    validate-patterns.ts throws, and orchestrator.ts (future) returns
    `Result.err()`.

    **Rationale:** The current `buildPipeline()` in pattern-graph-cli.ts calls
    `process.exit(1)` on errors, making it non-reusable. The factory must
    work across consumers with different error handling models. The Result
    monad is the project's established pattern for this (see
    `src/types/result.ts`).

    **Verified by:** Factory uses Result monad

    @acceptance-criteria
    Scenario: Factory uses Result monad
      Given the pipeline factory buildPatternGraph
      When a config error, scan error, or merge conflict occurs
      Then the factory returns Result.err with a structured PipelineError
      And it does not call process.exit or throw
      And the PipelineError includes the step that failed and the error details

  Rule: End-to-end verification confirms behavioral equivalence

    **Invariant:** After extraction, all CLI commands produce identical output
    to pre-refactor behavior with zero build, test, lint, and validation errors.

    **Rationale:** The refactor must not change observable behavior. Full CLI
    verification confirms the extraction is a pure refactor.

    **Verified by:** Full verification passes

    @acceptance-criteria
    Scenario: Full verification passes
      Given the complete refactored codebase
      When running pnpm build, pnpm test, pnpm lint, and pnpm validate:patterns
      Then all pass with zero errors
      And pnpm process:query -- overview produces the same output as before
      And pnpm process:query -- rules produces the same output as before
      And pnpm process:query -- rules --product-area DataAPI produces the same output as before
