# ✅ Data API Architecture Queries

**Purpose:** Detailed requirements for the Data API Architecture Queries feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Product Area | DeliveryProcess |
| Business Value | deep architecture exploration for design sessions |
| Phase | 25 |

## Description

**Problem:**
  The current `arch` subcommand provides basic queries (roles, context, layer, graph)
  but lacks deeper analysis needed for design sessions: pattern neighborhoods (what's
  directly connected), cross-context comparison, annotation coverage gaps, and
  taxonomy discovery. Agents exploring architecture must make multiple queries and
  mentally assemble the picture, wasting context tokens.

  **Solution:**
  Extend the `arch` subcommand and add new discovery commands:
  1. `arch neighborhood <pattern>` shows 1-hop relationships (direct uses/usedBy)
  2. `arch compare <ctx1> <ctx2>` shows shared deps and integration points
  3. `arch coverage` reports annotation completeness with gaps
  4. `tags` lists all tags in use with counts
  5. `sources` shows file inventory by type
  6. `unannotated [--path glob]` finds files without the libar-docs opt-in marker

  **Business Value:**
  | Benefit | Impact |
  | Pattern neighborhoods | Understand local architecture in one call |
  | Coverage gaps | Find unannotated files that need attention |
  | Taxonomy discovery | Know what tags and categories are available |
  | Cross-context analysis | Compare bounded contexts for integration |

## Acceptance Criteria

**Pattern neighborhood shows direct connections**

- Given a pattern "OrderSaga" in the "orders" context
- And "OrderSaga" uses "CommandBus" and "EventStore"
- And "OrderSaga" is used by "SagaRouter"
- When running "process-api arch neighborhood OrderSaga"
- Then the output shows "Uses: CommandBus, EventStore"
- And the output shows "Used by: SagaRouter"
- And the output shows sibling patterns in the "orders" context

**Cross-context comparison**

- Given contexts "orders" and "inventory" with some shared dependencies
- When running "process-api arch compare orders inventory"
- Then the output shows shared dependencies between contexts
- And the output shows unique dependencies per context
- And the output identifies integration points

**Neighborhood for nonexistent pattern returns error**

- Given no pattern named "NonExistent" exists
- When running "process-api arch neighborhood NonExistent"
- Then the command fails with a pattern-not-found error
- And the error message suggests checking the pattern name

**Architecture coverage report**

- Given 41 annotated files out of 50 scannable files
- When running "process-api arch coverage"
- Then the output shows "41/50 files annotated (82%)"
- And the output lists the 9 unannotated files
- And the output shows unused taxonomy values

**Find unannotated files with path filter**

- Given some TypeScript files without the libar-docs opt-in marker
- When running "process-api unannotated --path 'src/generators/**/*.ts'"
- Then the output lists only unannotated files matching the glob
- And each file shows its location relative to base directory

**Coverage with no scannable files returns zero coverage**

- Given the input globs match 0 files
- When running "process-api arch coverage"
- Then the output shows "0/0 files annotated (0%)"
- And the unannotated files list is empty

**List all tags with usage counts**

- Given patterns with various tags applied
- When running "process-api tags"
- Then the output lists each tag name with its usage count
- And category tags show their value distribution
- And status tags show their value distribution

**Source file inventory**

- Given TypeScript, Gherkin, and stub files in the pipeline
- When running "process-api sources"
- Then the output shows file counts by type
- And the output shows location patterns for each type
- And the total matches the pipeline scan count

**Tags listing with no patterns returns empty report**

- Given the pipeline has 0 patterns
- When running "process-api tags"
- Then the output shows an empty tag report with 0 pattern count
- And no tag entries are listed

## Business Rules

**Arch subcommand provides neighborhood and comparison views**

**Invariant:** Architecture queries resolve pattern names to concrete
    relationships and file paths, not just abstract names.

    **Rationale:** The current `arch graph <pattern>` returns dependency and
    relationship names but not the full picture of what surrounds a pattern.
    Design sessions need to understand: "If I'm working on X, what else is
    directly connected?" and "How do contexts A and B relate?"

    **Neighborhood output:**
    | Section | Content |
    | Triggered by | Patterns whose `usedBy` includes this pattern |
    | Uses | Patterns this calls directly |
    | Used by | Patterns that call this directly |
    | Same context | Sibling patterns in the same bounded context |

    **Verified by:** Neighborhood view, Cross-context comparison

_Verified by: Pattern neighborhood shows direct connections, Cross-context comparison, Neighborhood for nonexistent pattern returns error_

**Coverage analysis reports annotation completeness with gaps**

**Invariant:** Coverage reports identify unannotated files that should have
    the libar-docs opt-in marker based on their location and content.

    **Rationale:** Annotation completeness directly impacts the quality of all
    generated documentation and API queries. Files without the opt-in marker are
    invisible to the pipeline. Coverage gaps mean missing patterns in the
    registry, incomplete dependency graphs, and blind spots in architecture views.

    **Coverage output:**
    | Metric | Source |
    | Annotated files | Files with libar-docs opt-in |
    | Total scannable files | All .ts files in input globs |
    | Coverage percentage | annotated / total |
    | Missing files | Scannable files without annotations |
    | Unused roles/categories | Values defined in taxonomy but not used |

    **Verified by:** Coverage report, Unannotated file discovery

_Verified by: Architecture coverage report, Find unannotated files with path filter, Coverage with no scannable files returns zero coverage_

**Tags and sources commands provide taxonomy and inventory views**

**Invariant:** All tag values in use are discoverable without reading
    configuration files. Source file inventory shows the full scope of
    annotated and scanned content.

    **Rationale:** Agents frequently need to know "what categories exist?"
    or "how many feature files are there?" without reading taxonomy
    configuration. These are meta-queries about the annotation system itself,
    essential for writing new annotations correctly and understanding scope.

    **Tags output:**
    | Tag | Count | Example Values |
    | libar-docs-status | 69 | completed(36), roadmap(30), active(3) |
    | libar-docs-category | 41 | projection(6), saga(4), handler(5) |

    **Sources output:**
    | Source Type | Count | Location Pattern |
    | TypeScript (annotated) | 47 | src/**/*.ts |
    | Gherkin (feature files) | 37 | specs/**/*.feature |
    | Stub files | 22 | stubs/**/*.ts |
    | Decision files | 13 | decisions/**/*.feature |

    **Verified by:** Tags listing, Sources inventory

_Verified by: List all tags with usage counts, Source file inventory, Tags listing with no patterns returns empty report_

## Deliverables

- arch neighborhood handler (complete)
- arch compare handler (complete)
- arch coverage analyzer (complete)
- tags subcommand (complete)
- sources subcommand (complete)
- unannotated subcommand (complete)

## Implementations

Files that implement this pattern:

- [`coverage-analyzer.ts`](../../delivery-process/stubs/data-api-architecture-queries/coverage-analyzer.ts) - ## CoverageAnalyzer — Annotation Coverage and Taxonomy Gap Detection
- [`arch-queries.ts`](../../src/api/arch-queries.ts) - ## ArchQueries — Neighborhood, Comparison, Tags, Sources
- [`coverage-analyzer.ts`](../../src/api/coverage-analyzer.ts) - ## CoverageAnalyzer — Annotation Coverage and Taxonomy Gap Detection

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
