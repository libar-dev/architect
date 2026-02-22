@libar-docs
@libar-docs-pattern:UniversalDocGeneratorRobustness
@libar-docs-status:completed
@libar-docs-unlock-reason:All-deliverables-implemented-and-tested
@libar-docs-phase:28
@libar-docs-effort:2d
@libar-docs-product-area:Generation
@libar-docs-depends-on:DocGenerationProofOfConcept
@libar-docs-business-value:enables-monorepo-scale-doc-generation
@libar-docs-priority:high
Feature: Universal Document Generator - Robustness Foundation

  This feature transforms the PoC document generator into a production-ready
  universal generator capable of operating at monorepo scale (~210 manual docs
  to be replaced across the convex-event-sourcing repository).

  **GitHub Issue:** libar-ai/convex-event-sourcing#134

  # ============================================================================
  # CONTEXT: Why Robustness Before New Features
  # ============================================================================

  Rule: Context - PoC limitations prevent monorepo-scale operation

    **Invariant:** The document generator must produce correct, deduplicated output and surface all errors explicitly before operating at monorepo scale.
    **Rationale:** Silent failures and duplicated content in the PoC corrupt generated docs across all 210 target files, making bugs invisible until downstream consumers encounter broken documentation.

    **The Problem:**

    The DecisionDocGenerator PoC (Phase 27) successfully demonstrated code-first
    documentation generation, but has reliability issues that prevent scaling:

    | Issue | Impact | Example |
    | Content duplication | Confusing output | "Protection Levels" appears twice |
    | No validation | Silent failures | Missing files produce empty sections |
    | Scattered warnings | Hard to debug | console.warn in source-mapper.ts:149,339 |
    | No file validation | Runtime errors | Invalid paths crash extraction |

    **Why Fix Before Adding Features:**

    The monorepo has 210 manually maintained docs. Before adding ADR generation
    (33 files), guide generation (6 files), or glossary extraction, the foundation
    must be reliable. A bug at the source mapper level corrupts ALL generated docs.

    **Target State:**

    | Metric | Current | Target |
    | Duplicate sections | Common | Zero (fingerprint dedup) |
    | Invalid mapping errors | Silent | Explicit validation errors |
    | Warning visibility | console.warn | Structured Result warnings |
    | File validation | None | Pre-flight existence check |

  # ============================================================================
  # DECISION: Four Robustness Deliverables
  # ============================================================================

  Rule: Decision - Robustness requires four coordinated improvements

    **Invariant:** Robustness improvements must be implemented as four distinct, coordinated modules (deduplication, validation, warning collection, file validation) rather than ad-hoc fixes.
    **Rationale:** Scattering reliability fixes across existing code creates coupling and makes individual concerns untestable; isolated modules enable independent verification and replacement.

    **Architecture:**

    ```
    Source Mapping Table
           │
           ▼
    ┌─────────────────────────────┐
    │  Validation Layer (NEW)    │ ◄── Pre-flight checks
    │  - File existence          │
    │  - Method validity         │
    │  - Format validation       │
    └─────────────────────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │  Source Mapper             │
    │  - Warning collector (NEW) │ ◄── Structured warnings
    │  - Extraction dispatch     │
    └─────────────────────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │  Content Assembly          │
    │  - Deduplication (NEW)     │ ◄── Fingerprint-based
    │  - Section ordering        │
    └─────────────────────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │  RenderableDocument        │
    └─────────────────────────────┘
    ```

    **Deliverable Ownership:**

    | Deliverable | Module | Responsibility |
    | Content Deduplication | src/generators/content-deduplicator.ts | Remove duplicate sections |
    | Validation Layer | src/generators/source-mapping-validator.ts | Pre-flight checks |
    | Warning Collector | src/generators/warning-collector.ts | Unified warning handling |
    | File Validation | Integrated into validator | Existence + readability |

  # ============================================================================
  # DELIVERABLES
  # ============================================================================

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Content Deduplication | complete | src/generators/content-deduplicator.ts |
      | Source Mapping Validator | complete | src/generators/source-mapping-validator.ts |
      | Warning Collector | complete | src/generators/warning-collector.ts |
      | Migrate console.warn calls | complete | src/generators/source-mapper.ts |
      | Integration tests | complete | tests/features/doc-generation/robustness-integration.feature |

  # ============================================================================
  # SCENARIOS: Content Deduplication
  # ============================================================================

  Rule: Duplicate content must be detected and merged

    **Invariant:** No two sections in a generated document may have identical content fingerprints; duplicates must be merged into a single section with source attribution.
    **Rationale:** Duplicate sections confuse readers and inflate document size, undermining trust in generated documentation as a reliable replacement for manually maintained docs.

    Content fingerprinting identifies duplicate sections extracted from multiple
    sources. When duplicates are found, the system merges them intelligently
    based on source priority.

    @acceptance-criteria @happy-path
    Scenario: Identical sections are deduplicated
      Given a source mapping that extracts "Protection Levels" from two sources
      When the document is generated
      Then only one "Protection Levels" section appears in output
      And the section includes source attribution

    @acceptance-criteria @edge-case
    Scenario: Similar but non-identical sections are preserved
      Given a source mapping with "Overview" from TypeScript
      And another "Overview" from a feature file with different content
      When the document is generated
      Then both sections appear with distinct names
      And each section has source attribution

  # ============================================================================
  # SCENARIOS: Source Mapping Validation
  # ============================================================================

  Rule: Invalid source mappings must fail fast with clear errors

    **Invariant:** Every source mapping must pass pre-flight validation (file existence, method validity, readability) before any extraction is attempted.
    **Rationale:** Without pre-flight validation, invalid mappings produce silent failures or cryptic runtime errors, making it impossible to diagnose configuration problems at monorepo scale.

    Pre-flight validation catches configuration errors before extraction begins.
    This prevents silent failures and provides actionable error messages.

    @acceptance-criteria @happy-path
    Scenario: Valid source mapping passes validation
      Given a source mapping with:
        | Section | Source File | Extraction Method |
        | API Types | src/types.ts | @extract-shapes tag |
      And the source file exists
      When validating the source mapping
      Then validation succeeds
      And no warnings are produced

    @acceptance-criteria @validation
    Scenario: Missing file produces validation error
      Given a source mapping referencing "src/nonexistent.ts"
      When validating the source mapping
      Then validation fails with error "File not found: src/nonexistent.ts"
      And no extraction is attempted

    @acceptance-criteria @validation
    Scenario: Invalid extraction method produces validation error
      Given a source mapping with method "invalid-method"
      When validating the source mapping
      Then validation fails with error containing "Unknown extraction method"
      And suggestions for valid methods are provided

    @acceptance-criteria @validation
    Scenario: Unreadable file produces validation error
      Given a source mapping referencing a file without read permission
      When validating the source mapping
      Then validation fails with error "Cannot read file"

  # ============================================================================
  # SCENARIOS: Warning Collector
  # ============================================================================

  Rule: Warnings must be collected and reported consistently

    **Invariant:** All non-fatal issues during extraction must be captured in a structured warning collector grouped by source, never emitted via console.warn.
    **Rationale:** Scattered console.warn calls are lost in CI output and lack source context, making it impossible to trace warnings back to the configuration entry that caused them.

    The warning collector replaces scattered console.warn calls with a
    structured system that aggregates warnings and reports them consistently.

    @acceptance-criteria @happy-path
    Scenario: Warnings are collected during extraction
      Given extraction encounters a non-fatal issue
      When extraction completes
      Then the warning is captured in the warning collector
      And the warning includes source location and context

    @acceptance-criteria @happy-path
    Scenario: Multiple warnings from different sources are aggregated
      Given extraction from source A produces warning "Missing JSDoc"
      And extraction from source B produces warning "Empty rule block"
      When extraction completes
      Then both warnings are present in the collector
      And warnings are grouped by source file

    @acceptance-criteria @integration
    Scenario: Warnings are included in Result type
      Given the source mapper returns a Result
      When warnings were collected during extraction
      Then Result.warnings contains all collected warnings
      And the Result is still successful if no errors occurred

  # ============================================================================
  # CONSEQUENCES
  # ============================================================================

  Rule: Consequence - Improved reliability at cost of stricter validation

    **Invariant:** Existing source mappings that previously succeeded silently may now fail validation and must be updated to conform to the stricter checks.
    **Rationale:** Allowing invalid mappings to bypass validation would preserve the silent-failure behavior the robustness work was designed to eliminate.

    **Positive:**

    - Duplicate content eliminated from generated docs
    - Configuration errors caught before extraction
    - Debugging simplified with structured warnings
    - Ready for monorepo-scale operation

    **Negative:**

    - Existing source mappings may need updates to pass validation
    - Strict validation may require more upfront configuration
    - Additional processing overhead for deduplication

    **Migration:**

    Existing decision documents using the PoC generator may need updates:
    1. Run validation in dry-run mode to identify issues
    2. Fix file paths and extraction methods
    3. Re-run generation with new robustness checks
