@architect
@architect-pattern:ValidatorReadModelConsolidation
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-phase:100
@architect-effort:3d
@architect-product-area:Validation
@architect-include:process-workflow,codec-transformation
@architect-depends-on:ADR006SingleReadModelArchitecture
@architect-business-value:eliminate-parallel-pipeline-and-relationship-blind-spots-in-validator
@architect-priority:high
Feature: Validator Read Model Consolidation

  **Problem:**
  `validate-patterns.ts` is the only feature consumer that bypasses the
  PatternGraph. It wires its own mini-pipeline (scan + extract + ad-hoc
  matching), creates a lossy local type (`GherkinPatternInfo`) that discards
  relationship data, and then fails to resolve `@architect-implements`
  links — producing 7 false-positive warnings.

  This is the Parallel Pipeline anti-pattern identified in ADR-006. The
  validator re-derives pattern identity and cross-source matching from raw
  scanner/extractor output, ignoring the relationship index that the
  PatternGraph already computes with full forward and reverse edges.

  **Current violations in validate-patterns.ts (lines refer to pre-refactor):**

  | Anti-Pattern | Location | Evidence |
  | Parallel Pipeline | Lines 32-35 | Imports scanPatterns, scanGherkinFiles, extractPatterns, extractProcessMetadata |
  | Lossy Local Type | Lines 82-88 | GherkinPatternInfo keeps 5 of 30+ ExtractedPattern fields |
  | Re-derived Relationship | Lines 373-384 | Builds Map by name-equality, cannot resolve implements links |

  **Current 7 warnings decomposed:**

  | Warning Pattern | Root Cause | Fix Category |
  | ShapeExtractor | Has @architect-implements ShapeExtraction — only resolvable via relationshipIndex | Relationship-blind |
  | DecisionDocGenerator | Test feature DecisionDocGeneratorTesting has @architect-implements:DecisionDocGenerator | Relationship-blind |
  | ContentDeduplicator | Utility with @architect-phase 28 but no Gherkin spec | Spurious phase tag |
  | FileCache | Utility with @architect-phase 27 but no Gherkin spec | Spurious phase tag |
  | WarningCollector | Utility with @architect-phase 28 but no Gherkin spec | Spurious phase tag |
  | SourceMappingValidator | Utility with @architect-phase 28 but no Gherkin spec | Spurious phase tag |
  | SourceMapper | Utility with @architect-phase 27 but no Gherkin spec | Spurious phase tag |

  **Solution:**
  Refactor `validate-patterns.ts` to consume the PatternGraph as its
  data source for cross-source validation. The validator becomes a feature
  consumer like codecs and the PatternGraphAPI — querying pre-computed
  views and the relationship index instead of building its own maps from
  raw data.

  This eliminates:
  - `GherkinPatternInfo` (Lossy Local Type)
  - `extractGherkinPatternInfo()` (duplicate extractor)
  - Ad-hoc name-matching maps that miss implements relationships
  - The need for any `buildImplementsLookup()` helper

  The validator retains its own validation logic (what to check, what
  severity to assign). Only its data access changes — from raw state
  to the read model.

  **Design Decisions:**

  DD-1: Reuse the same pipeline as pattern-graph-cli.ts — not a shared factory yet.
  The validator will wire scan-extract-merge-transform inline, mirroring
  how pattern-graph-cli.ts does it today (lines 490-558). Extracting a shared
  pipeline factory is scoped to PatternGraphLayeredExtraction, not this spec.
  This keeps the refactoring focused on data-access only.

  DD-2: The validatePatterns() function signature changes from
  (tsPatterns, gherkinPatterns) to (dataset: RuntimePatternGraph).
  All cross-source matching uses dataset.patterns + dataset.relationshipIndex.
  The function remains exported for testability.

  DD-3: Cross-source matching uses a two-phase approach:
  Phase 1 — Build a name-based Map from dataset.patterns (same as today).
  Phase 2 — For each TS pattern not matched by name, check if it appears
  in any relationshipIndex entry's implementedBy array. This resolves
  the ShapeExtractor and DecisionDocGenerator false positives.

  DD-4: The validator will import transformToPatternGraphWithValidation
  from generators/pipeline/index.js, plus the merge and hierarchy helpers
  already used by pattern-graph-cli.ts. This is a temporary parallel pipeline
  (acknowledged) that will be replaced when the pipeline factory exists.

  DD-5: Phase tag removal from utility patterns is a separate atomic step
  done first — it reduces warnings from 7 to 2 and is independently
  verifiable before touching any validator code.

  **Implementation Order:**

  | Step | What | Verification |
  | 1 | Remove @architect-phase from 5 utility files | pnpm build, warnings drop from 7 to 2 |
  | 2 | Wire PatternGraph pipeline in main() | pnpm typecheck |
  | 3 | Rewrite validatePatterns() to consume RuntimePatternGraph | pnpm typecheck |
  | 4 | Delete GherkinPatternInfo, extractGherkinPatternInfo | pnpm typecheck, pnpm test |
  | 5 | Remove unused scanner/extractor imports | pnpm lint |
  | 6 | Run pnpm validate:patterns — verify 0 errors, 0 warnings | Full verification |

  **Files Modified:**

  | File | Change | Lines Affected |
  | src/cli/validate-patterns.ts | Major: rewrite pipeline + validatePatterns() | ~200 lines net reduction |
  | src/generators/content-deduplicator.ts | Remove @architect-phase 28 | Line 6 |
  | src/cache/file-cache.ts | Remove @architect-phase 27 | Line 5 |
  | src/generators/warning-collector.ts | Remove @architect-phase 28 | Line 6 |
  | src/generators/source-mapping-validator.ts | Remove @architect-phase 28 | Line 6 |
  | src/generators/source-mapper.ts | Remove @architect-phase 27 | Line 6 |

  **What does NOT change:**

  - ValidationIssue, ValidationSummary, ValidateCLIConfig interfaces (stable API)
  - parseArgs(), printHelp(), formatPretty(), formatJson() (CLI shell — untouched)
  - DoD validation (already consumes scanned Gherkin files directly — correct for its purpose)
  - Anti-pattern detection (already consumes scanned files — correct for its purpose)
  - Exit code logic (unchanged)

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Remove phase tags from 5 utility patterns | complete | 5 TS files (see Files Modified) |
      | Wire PatternGraph pipeline in main() | complete | src/cli/validate-patterns.ts |
      | Rewrite validatePatterns() to consume RuntimePatternGraph | complete | src/cli/validate-patterns.ts |
      | Delete GherkinPatternInfo and extractGherkinPatternInfo | complete | src/cli/validate-patterns.ts |
      | Remove unused scanner/extractor imports | complete | src/cli/validate-patterns.ts |
      | Zero warnings on pnpm validate:patterns | complete | CLI output |

  Rule: Validator queries the read model for cross-source matching

    **Invariant:** Pattern identity resolution — including implements
    relationships in both directions — uses `PatternGraph.relationshipIndex`
    rather than ad-hoc name-equality maps built from raw scanner output.

    **Rationale:** The PatternGraph computes implementedBy reverse lookups
    in transform-dataset.ts (second pass, lines 488-546). The validator's
    current name-equality Map cannot resolve ShapeExtractor -> ShapeExtraction
    or DecisionDocGeneratorTesting -> DecisionDocGenerator because these are
    implements relationships, not name matches.

    **Verified by:** Implements resolve bidirectionally, TS implementing Gherkin resolves

    @acceptance-criteria
    Scenario: Implements relationships resolve in both directions
      Given a TS pattern "DecisionDocGenerator"
      And a Gherkin feature "DecisionDocGeneratorTesting" with @architect-implements:DecisionDocGenerator
      When running cross-source validation
      Then no warning is produced for "DecisionDocGenerator"
      And the relationship is resolved via PatternGraph.relationshipIndex

    @acceptance-criteria
    Scenario: TS pattern implementing a Gherkin spec resolves
      Given a TS pattern "ShapeExtractor" with @architect-implements ShapeExtraction
      And a Gherkin feature "ShapeExtraction"
      When running cross-source validation
      Then no warning is produced for "ShapeExtractor"

  Rule: No lossy local types in the validator

    **Invariant:** The validator operates on `ExtractedPattern` from the
    PatternGraph, not a consumer-local DTO that discards fields.

    **Rationale:** GherkinPatternInfo keeps only name, phase, status, file,
    and deliverables — discarding uses, dependsOn, implementsPatterns,
    include, productArea, rules, and 20+ other fields. When the validator
    needs relationship data, it cannot access it through the lossy type.

    **Verified by:** GherkinPatternInfo type is eliminated

    @acceptance-criteria
    Scenario: GherkinPatternInfo type is eliminated
      Given the refactored validate-patterns.ts
      When inspecting the module
      Then no GherkinPatternInfo interface exists
      And no extractGherkinPatternInfo function exists
      And pattern data comes from PatternGraph.patterns

  Rule: Utility patterns without specs are not false positives

    **Invariant:** Internal utility patterns that have a `@architect-phase`
    but will never have a Gherkin spec should not carry phase metadata.
    Phase tags signal roadmap participation.

    **Rationale:** Five utility patterns (ContentDeduplicator, FileCache,
    WarningCollector, SourceMappingValidator, SourceMapper) have phase tags
    from the phase when they were built. They are infrastructure, not roadmap
    features. The validator correctly reports missing Gherkin for patterns
    with phases — the fix is removing the phase tag, not suppressing the
    warning.

    **Verified by:** Utility patterns do not trigger warnings

    @acceptance-criteria
    Scenario: Utility patterns do not trigger warnings
      Given ContentDeduplicator and FileCache without phase tags
      When running cross-source validation
      Then no warning is produced for either pattern

  @acceptance-criteria
  Scenario: Full validation suite passes with zero warnings
    Given the complete codebase with all annotated patterns
    When running pnpm validate:patterns
    Then exit code is 0
    And warning count is 0
    And error count is 0
