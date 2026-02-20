# UniversalDocGeneratorRobustness

**Purpose:** Detailed patterns for UniversalDocGeneratorRobustness

---

## Summary

**Progress:** [████████████████████] 2/2 (100%)

| Status | Count |
| --- | --- |
| ✅ Completed | 2 |
| 🚧 Active | 0 |
| 📋 Planned | 0 |
| **Total** | 2 |

---

## ✅ Completed Patterns

### ✅ Scoped Architectural View

| Property | Value |
| --- | --- |
| Status | completed |
| Effort | 3d |
| Business Value | enables selective pattern composition with architecture diagrams |

**Problem:**
  Full architecture diagrams show every annotated pattern in the project. For focused
  use cases -- design session context, PR descriptions, CLAUDE.md module sections --
  developers need views scoped to a small set of relevant patterns with their immediate
  neighbors. Manually curating diagram content defeats the code-first principle.

  **Solution:**
  A `DiagramScope` filter interface that selects patterns by three dimensions
  (`archContext`, `archView`, or explicit pattern names), automatically discovers
  neighbor patterns via relationship edges, and renders scoped Mermaid diagrams
  with subgraph grouping and distinct neighbor styling.

  The `arch-view` tag enables patterns to declare membership in named architectural
  views (e.g., `codec-transformation`, `pipeline-stages`). A single pattern can
  belong to multiple views. The transformer groups patterns by view in the
  `ArchIndex.byView` pre-computed index for O(1) access at render time.

  **Why It Matters:**
  | Benefit | How |
  | Focused context for AI sessions | Select 3-5 patterns instead of 50+ |
  | Automatic neighbor discovery | Related patterns appear without explicit listing |
  | Multiple views per pattern | One annotation, many documents |
  | Two detail levels from one config | Detailed (with diagram) and summary (table only) |
  | Reusable across document types | PR descriptions, CLAUDE.md, design context |

#### Dependencies

- Depends on: ArchitectureDiagramGeneration
- Depends on: ShapeExtraction

#### Acceptance Criteria

**archContext filter matches patterns in that context**

- Given patterns annotated with archContext "renderer"
- And a DiagramScope with archContext "renderer"
- When the scope filter runs
- Then only patterns in the "renderer" context appear

**archView filter matches patterns with that view**

- Given patterns annotated with archView "codec-transformation"
- And a DiagramScope with archView "codec-transformation"
- When the scope filter runs
- Then patterns belonging to the "codec-transformation" view appear

**Multiple filter dimensions OR together**

- Given a pattern with archContext "scanner" and no archView
- And a pattern with archView "pipeline-stages" and no archContext
- And a DiagramScope with archContext "scanner" and archView "pipeline-stages"
- When the scope filter runs
- Then both patterns appear in the result

**Neighbor patterns appear with dashed styling**

- Given scope patterns that use a pattern outside the scope
- When the scoped diagram is built
- Then the neighbor appears in a "Related" subgraph
- And the neighbor node has dashed border styling

**Self-contained scope produces no neighbor subgraph**

- Given scope patterns with no external relationships
- When the scoped diagram is built
- Then no "Related" subgraph appears

**Two diagram scopes produce two mermaid blocks**

- Given a config with two diagramScopes entries
- When the reference codec renders at detailed level
- Then the output contains two separate mermaid code blocks

**Direction controls diagram orientation**

- Given a DiagramScope with direction "LR"
- When the scoped diagram is built
- Then the mermaid block contains "graph LR"

**Summary detail level omits all diagrams**

- Given a config with diagramScopes entries
- When the reference codec renders at summary level
- Then the output contains no mermaid code blocks

#### Business Rules

**Scope filtering selects patterns by context, view, or name**

**Invariant:** A pattern matches a DiagramScope if ANY of three conditions hold:
    its name is in `scope.patterns`, its `archContext` is in `scope.archContext`,
    or any of its `archView` entries is in `scope.archView`. These dimensions are
    OR'd together -- a pattern need only match one.

    **Rationale:** Three filter dimensions cover different authoring workflows.
    Explicit names for ad-hoc documents, archContext for bounded context views,
    archView for cross-cutting architectural perspectives.

    **Verified by:** archContext filter matches patterns,
    archView filter matches patterns, combined filters OR together

_Verified by: archContext filter matches patterns in that context, archView filter matches patterns with that view, Multiple filter dimensions OR together_

**Neighbor discovery finds connected patterns outside scope**

**Invariant:** Patterns connected to scope patterns via relationship edges
    (uses, dependsOn, implementsPatterns, extendsPattern) but NOT themselves in
    scope appear in a "Related" subgraph with dashed border styling.

    **Rationale:** Scoped views need context. Showing only in-scope patterns
    without their dependencies loses critical relationship information.
    Neighbor patterns provide this context without cluttering the main view.

    **Verified by:** Neighbor patterns appear in diagram, Self-contained scope has no neighbors

_Verified by: Neighbor patterns appear with dashed styling, Self-contained scope produces no neighbor subgraph_

**Multiple diagram scopes compose in sequence**

**Invariant:** When `diagramScopes` is an array, each scope produces its own
    Mermaid diagram section with independent title, direction, and pattern selection.
    At summary detail level, all diagrams are suppressed.

    **Rationale:** A single reference document may need multiple architectural
    perspectives. Pipeline Overview shows both a codec transformation view (TB)
    and a pipeline data flow view (LR) in the same document.

    **Verified by:** Two scopes produce two mermaid blocks,
    Direction controls diagram orientation, Summary level omits diagrams

_Verified by: Two diagram scopes produce two mermaid blocks, Direction controls diagram orientation, Summary detail level omits all diagrams_

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

[← Back to Roadmap](../ROADMAP.md)
