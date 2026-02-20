# ✅ Validator Read Model Consolidation

**Purpose:** Detailed documentation for the Validator Read Model Consolidation pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | DDD |
| Phase | 100 |

## Description

**Problem:**
  `validate-patterns.ts` is the only feature consumer that bypasses the
  MasterDataset. It wires its own mini-pipeline (scan + extract + ad-hoc
  matching), creates a lossy local type (`GherkinPatternInfo`) that discards
  relationship data, and then fails to resolve `@libar-docs-implements`
  links — producing 7 false-positive warnings.

  This is the Parallel Pipeline anti-pattern identified in ADR-006. The
  validator re-derives pattern identity and cross-source matching from raw
  scanner/extractor output, ignoring the relationship index that the
  MasterDataset already computes with full forward and reverse edges.

  **Current violations in validate-patterns.ts (lines refer to pre-refactor):**

  | Anti-Pattern | Location | Evidence |
  | Parallel Pipeline | Lines 32-35 | Imports scanPatterns, scanGherkinFiles, extractPatterns, extractProcessMetadata |
  | Lossy Local Type | Lines 82-88 | GherkinPatternInfo keeps 5 of 30+ ExtractedPattern fields |
  | Re-derived Relationship | Lines 373-384 | Builds Map by name-equality, cannot resolve implements links |

  **Current 7 warnings decomposed:**

  | Warning Pattern | Root Cause | Fix Category |
  | ShapeExtractor | Has @libar-docs-implements ShapeExtraction — only resolvable via relationshipIndex | Relationship-blind |
  | DecisionDocGenerator | Test feature DecisionDocGeneratorTesting has @libar-docs-implements:DecisionDocGenerator | Relationship-blind |
  | ContentDeduplicator | Utility with @libar-docs-phase 28 but no Gherkin spec | Spurious phase tag |
  | FileCache | Utility with @libar-docs-phase 27 but no Gherkin spec | Spurious phase tag |
  | WarningCollector | Utility with @libar-docs-phase 28 but no Gherkin spec | Spurious phase tag |
  | SourceMappingValidator | Utility with @libar-docs-phase 28 but no Gherkin spec | Spurious phase tag |
  | SourceMapper | Utility with @libar-docs-phase 27 but no Gherkin spec | Spurious phase tag |

  **Solution:**
  Refactor `validate-patterns.ts` to consume the MasterDataset as its
  data source for cross-source validation. The validator becomes a feature
  consumer like codecs and the ProcessStateAPI — querying pre-computed
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

  DD-1: Reuse the same pipeline as process-api.ts — not a shared factory yet.
  The validator will wire scan-extract-merge-transform inline, mirroring
  how process-api.ts does it today (lines 490-558). Extracting a shared
  pipeline factory is scoped to ProcessAPILayeredExtraction, not this spec.
  This keeps the refactoring focused on data-access only.

  DD-2: The validatePatterns() function signature changes from
  (tsPatterns, gherkinPatterns) to (dataset: RuntimeMasterDataset).
  All cross-source matching uses dataset.patterns + dataset.relationshipIndex.
  The function remains exported for testability.

  DD-3: Cross-source matching uses a two-phase approach:
  Phase 1 — Build a name-based Map from dataset.patterns (same as today).
  Phase 2 — For each TS pattern not matched by name, check if it appears
  in any relationshipIndex entry's implementedBy array. This resolves
  the ShapeExtractor and DecisionDocGenerator false positives.

  DD-4: The validator will import transformToMasterDatasetWithValidation
  from generators/pipeline/index.js, plus the merge and hierarchy helpers
  already used by process-api.ts. This is a temporary parallel pipeline
  (acknowledged) that will be replaced when the pipeline factory exists.

  DD-5: Phase tag removal from utility patterns is a separate atomic step
  done first — it reduces warnings from 7 to 2 and is independently
  verifiable before touching any validator code.

  **Implementation Order:**

  | Step | What | Verification |
  | 1 | Remove @libar-docs-phase from 5 utility files | pnpm build, warnings drop from 7 to 2 |
  | 2 | Wire MasterDataset pipeline in main() | pnpm typecheck |
  | 3 | Rewrite validatePatterns() to consume RuntimeMasterDataset | pnpm typecheck |
  | 4 | Delete GherkinPatternInfo, extractGherkinPatternInfo | pnpm typecheck, pnpm test |
  | 5 | Remove unused scanner/extractor imports | pnpm lint |
  | 6 | Run pnpm validate:patterns — verify 0 errors, 0 warnings | Full verification |

  **Files Modified:**

  | File | Change | Lines Affected |
  | src/cli/validate-patterns.ts | Major: rewrite pipeline + validatePatterns() | ~200 lines net reduction |
  | src/generators/content-deduplicator.ts | Remove @libar-docs-phase 28 | Line 6 |
  | src/cache/file-cache.ts | Remove @libar-docs-phase 27 | Line 5 |
  | src/generators/warning-collector.ts | Remove @libar-docs-phase 28 | Line 6 |
  | src/generators/source-mapping-validator.ts | Remove @libar-docs-phase 28 | Line 6 |
  | src/generators/source-mapper.ts | Remove @libar-docs-phase 27 | Line 6 |

  **What does NOT change:**

  - ValidationIssue, ValidationSummary, ValidateCLIConfig interfaces (stable API)
  - parseArgs(), printHelp(), formatPretty(), formatJson() (CLI shell — untouched)
  - DoD validation (already consumes scanned Gherkin files directly — correct for its purpose)
  - Anti-pattern detection (already consumes scanned files — correct for its purpose)
  - Exit code logic (unchanged)

## Dependencies

- Depends on: ADR006SingleReadModelArchitecture

## Acceptance Criteria

**Implements relationships resolve in both directions**

- Given a TS pattern "DecisionDocGenerator"
- And a Gherkin feature "DecisionDocGeneratorTesting" with @libar-docs-implements:DecisionDocGenerator
- When running cross-source validation
- Then no warning is produced for "DecisionDocGenerator"
- And the relationship is resolved via MasterDataset.relationshipIndex

**TS pattern implementing a Gherkin spec resolves**

- Given a TS pattern "ShapeExtractor" with @libar-docs-implements ShapeExtraction
- And a Gherkin feature "ShapeExtraction"
- When running cross-source validation
- Then no warning is produced for "ShapeExtractor"

**GherkinPatternInfo type is eliminated**

- Given the refactored validate-patterns.ts
- When inspecting the module
- Then no GherkinPatternInfo interface exists
- And no extractGherkinPatternInfo function exists
- And pattern data comes from MasterDataset.patterns

**Utility patterns do not trigger warnings**

- Given ContentDeduplicator and FileCache without phase tags
- When running cross-source validation
- Then no warning is produced for either pattern

**Full validation suite passes with zero warnings**

- Given the complete codebase with all annotated patterns
- When running pnpm validate:patterns
- Then exit code is 0
- And warning count is 0
- And error count is 0

## Business Rules

**Validator queries the read model for cross-source matching**

**Invariant:** Pattern identity resolution — including implements
    relationships in both directions — uses `MasterDataset.relationshipIndex`
    rather than ad-hoc name-equality maps built from raw scanner output.

    **Rationale:** The MasterDataset computes implementedBy reverse lookups
    in transform-dataset.ts (second pass, lines 488-546). The validator's
    current name-equality Map cannot resolve ShapeExtractor -> ShapeExtraction
    or DecisionDocGeneratorTesting -> DecisionDocGenerator because these are
    implements relationships, not name matches.

    **Verified by:** Implements resolve bidirectionally, TS implementing Gherkin resolves

_Verified by: Implements relationships resolve in both directions, TS pattern implementing a Gherkin spec resolves_

**No lossy local types in the validator**

**Invariant:** The validator operates on `ExtractedPattern` from the
    MasterDataset, not a consumer-local DTO that discards fields.

    **Rationale:** GherkinPatternInfo keeps only name, phase, status, file,
    and deliverables — discarding uses, dependsOn, implementsPatterns,
    include, productArea, rules, and 20+ other fields. When the validator
    needs relationship data, it cannot access it through the lossy type.

    **Verified by:** GherkinPatternInfo type is eliminated

_Verified by: GherkinPatternInfo type is eliminated_

**Utility patterns without specs are not false positives**

**Invariant:** Internal utility patterns that have a `@libar-docs-phase`
    but will never have a Gherkin spec should not carry phase metadata.
    Phase tags signal roadmap participation.

    **Rationale:** Five utility patterns (ContentDeduplicator, FileCache,
    WarningCollector, SourceMappingValidator, SourceMapper) have phase tags
    from the phase when they were built. They are infrastructure, not roadmap
    features. The validator correctly reports missing Gherkin for patterns
    with phases — the fix is removing the phase tag, not suppressing the
    warning.

    **Verified by:** Utility patterns do not trigger warnings

_Verified by: Utility patterns do not trigger warnings, Full validation suite passes with zero warnings_

---

[← Back to Pattern Registry](../PATTERNS.md)
