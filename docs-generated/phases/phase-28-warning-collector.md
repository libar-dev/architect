# WarningCollector

**Purpose:** Detailed patterns for WarningCollector

---

## Summary

**Progress:** [████████████████████] 4/4 (100%)

| Status | Count |
| --- | --- |
| ✅ Completed | 4 |
| 🚧 Active | 0 |
| 📋 Planned | 0 |
| **Total** | 4 |

---

## ✅ Completed Patterns

### ✅ Content Deduplicator

| Property | Value |
| --- | --- |
| Status | completed |

## Content Deduplicator - Duplicate Content Detection and Merging

Identifies and merges duplicate sections extracted from multiple sources.
Uses content fingerprinting to detect duplicates and merges them based on
configurable priority rules.

### When to Use

- After source mapping extracts content from multiple files
- When multiple sources may contain the same documentation
- Before assembling the final RenderableDocument

### Key Concepts

- **Content Fingerprint**: SHA-256 hash of normalized text for duplicate detection
- **Source Priority**: TypeScript > Decision > Feature file
- **Content Richness**: More lines wins when priorities are equal
- **Header Disambiguation**: Adds source suffix when headers conflict

---

### ✅ Source Mapping Validator

| Property | Value |
| --- | --- |
| Status | completed |

## Source Mapping Validator - Pre-flight Validation

Performs pre-flight checks on source mapping tables before extraction begins.
Validates file existence, extraction method validity, and format correctness
to fail fast with clear errors rather than producing incomplete output.

### When to Use

- Before document generation from source mappings
- When validating decision document source tables
- When checking extraction method compatibility

### Validation Checks

1. **File existence**: Source files must exist and be files (not directories)
2. **Method validity**: Extraction methods must be recognized
3. **Compatibility**: Extraction methods must match file types
4. **Table format**: Required columns must be present

---

### ✅ Universal Doc Generator Robustness

| Property | Value |
| --- | --- |
| Status | completed |
| Effort | 2d |
| Business Value | enables monorepo scale doc generation |

This feature transforms the PoC document generator into a production-ready
  universal generator capable of operating at monorepo scale (~210 manual docs
  to be replaced across the convex-event-sourcing repository).

  **GitHub Issue:** libar-ai/convex-event-sourcing#134

#### Dependencies

- Depends on: DocGenerationProofOfConcept

#### Acceptance Criteria

**Identical sections are deduplicated**

- Given a source mapping that extracts "Protection Levels" from two sources
- When the document is generated
- Then only one "Protection Levels" section appears in output
- And the section includes source attribution

**Similar but non-identical sections are preserved**

- Given a source mapping with "Overview" from TypeScript
- And another "Overview" from a feature file with different content
- When the document is generated
- Then both sections appear with distinct names
- And each section has source attribution

**Valid source mapping passes validation**

- Given a source mapping with:
- And the source file exists
- When validating the source mapping
- Then validation succeeds
- And no warnings are produced

| Section | Source File | Extraction Method |
| --- | --- | --- |
| API Types | src/types.ts | @extract-shapes tag |

**Missing file produces validation error**

- Given a source mapping referencing "src/nonexistent.ts"
- When validating the source mapping
- Then validation fails with error "File not found: src/nonexistent.ts"
- And no extraction is attempted

**Invalid extraction method produces validation error**

- Given a source mapping with method "invalid-method"
- When validating the source mapping
- Then validation fails with error containing "Unknown extraction method"
- And suggestions for valid methods are provided

**Unreadable file produces validation error**

- Given a source mapping referencing a file without read permission
- When validating the source mapping
- Then validation fails with error "Cannot read file"

**Warnings are collected during extraction**

- Given extraction encounters a non-fatal issue
- When extraction completes
- Then the warning is captured in the warning collector
- And the warning includes source location and context

**Multiple warnings from different sources are aggregated**

- Given extraction from source A produces warning "Missing JSDoc"
- And extraction from source B produces warning "Empty rule block"
- When extraction completes
- Then both warnings are present in the collector
- And warnings are grouped by source file

**Warnings are included in Result type**

- Given the source mapper returns a Result
- When warnings were collected during extraction
- Then Result.warnings contains all collected warnings
- And the Result is still successful if no errors occurred

#### Business Rules

**Context - PoC limitations prevent monorepo-scale operation**

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

**Decision - Robustness requires four coordinated improvements**

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

**Duplicate content must be detected and merged**

Content fingerprinting identifies duplicate sections extracted from multiple
    sources. When duplicates are found, the system merges them intelligently
    based on source priority.

_Verified by: Identical sections are deduplicated, Similar but non-identical sections are preserved_

**Invalid source mappings must fail fast with clear errors**

Pre-flight validation catches configuration errors before extraction begins.
    This prevents silent failures and provides actionable error messages.

_Verified by: Valid source mapping passes validation, Missing file produces validation error, Invalid extraction method produces validation error, Unreadable file produces validation error_

**Warnings must be collected and reported consistently**

The warning collector replaces scattered console.warn calls with a
    structured system that aggregates warnings and reports them consistently.

_Verified by: Warnings are collected during extraction, Multiple warnings from different sources are aggregated, Warnings are included in Result type_

**Consequence - Improved reliability at cost of stricter validation**

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

---

### ✅ Warning Collector

| Property | Value |
| --- | --- |
| Status | completed |

## Warning Collector - Unified Warning Handling

Provides a unified system for capturing, categorizing, and reporting
non-fatal issues during document generation. Replaces scattered console.warn
calls with structured warning handling that integrates with the Result pattern.

### When to Use

- When generating documentation from source mappings
- When extracting content from TypeScript or Gherkin files
- When deduplicating or assembling content sections

### Key Concepts

- **Warning Categories**: validation, extraction, deduplication, file-access, format
- **Source Attribution**: Each warning includes source file and optional line number
- **Aggregation**: Warnings collected across pipeline stages, maintaining insertion order
- **Formatting**: Console, JSON, and markdown output formats

---

[← Back to Roadmap](../ROADMAP.md)
