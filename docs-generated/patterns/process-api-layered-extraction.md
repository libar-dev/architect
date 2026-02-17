# 📋 Process API Layered Extraction

**Purpose:** Detailed documentation for the Process API Layered Extraction pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Category | DDD |
| Phase | 100 |

## Description

**Problem:**
  `process-api.ts` is 1,700 lines containing three distinct responsibilities
  in one file: CLI shell (arg parsing, help, output formatting), pipeline
  orchestration (scan, extract, transform), and subcommand domain logic
  (rules grouping, stub resolution, scope validation).

  The subcommand handlers are feature consumers of the MasterDataset —
  per ADR-006 they belong in the API layer, not the CLI layer. Some already
  have API counterparts (`context-assembler.ts`, `arch-queries.ts`,
  `scope-validator.ts`), but others (`handleRules`, `handleStubs`,
  `handleDecisions`, `handlePdr`) do domain logic inline in the CLI file.

  This means:
  - Domain logic is only accessible via CLI (not programmatically testable)
  - `handleRules()` alone is 183 lines building its own Map hierarchies
  - Adding a new query requires modifying the CLI file
  - Pipeline orchestration is duplicated between process-api.ts,
    orchestrator.ts, and validate-patterns.ts (three consumers wiring
    the same scan-extract-transform sequence)

  **Solution:**
  Extract process-api.ts into three clean layers that mirror the project's
  own architecture (ADR-006 boundary: orchestration vs feature consumption):

  | Layer | Responsibility | Location |
  | CLI Shell | Arg parsing, help text, output formatting, error envelope | src/cli/process-api.ts (slim) |
  | Pipeline Factory | Shared scan-extract-transform sequence | src/generators/pipeline/ (reusable) |
  | Query Handlers | Domain logic consuming MasterDataset | src/api/ modules |

  The CLI becomes a thin routing layer: parse args, call pipeline factory,
  route subcommand to API module, format output. No domain logic in the CLI.

  This also enables the ValidatorReadModelConsolidation spec — once the
  pipeline factory exists, validate-patterns.ts can consume it instead of
  wiring its own mini-pipeline.

## Dependencies

- Depends on: ValidatorReadModelConsolidation

## Acceptance Criteria

**CLI routing shell**

- Given the refactored process-api.ts
- When inspecting the module
- Then no Map or Set construction exists in handler functions
- And each subcommand delegates to an src/api/ module
- And process-api.ts is under 500 lines

**Pipeline factory is shared**

- Given orchestrator.ts, process-api.ts, and validate-patterns.ts
- When each needs a MasterDataset
- Then each calls the shared pipeline factory
- And no consumer independently imports from scanner/ and extractor/

**No parallel pipelines**

- Given the codebase after refactoring
- When searching for scanPatterns imports outside pipeline/
- Then only the pipeline factory and lint-patterns.ts import it

**Domain logic in API modules**

- Given handleRules business rules grouping logic
- When extracted to src/api/rules-query.ts
- Then the module exports a pure function taking MasterDataset
- And the CLI handler calls it and formats the result
- And the function is independently testable

## Business Rules

**CLI file contains only routing, no domain logic**

**Invariant:** `process-api.ts` parses arguments, calls a pipeline
    factory for the MasterDataset, routes subcommands to API modules, and
    formats output. It does not build Maps, filter patterns, group data,
    or resolve relationships.

    **Verified by:** CLI routing shell, Domain logic in API modules

_Verified by: CLI routing shell_

**Pipeline factory is shared across consumers**

**Invariant:** The scan-extract-transform sequence is defined once in a
    reusable factory. All consumers that need a MasterDataset — orchestrator,
    process-api, validate-patterns — call the same factory rather than wiring
    the pipeline independently.

    **Verified by:** Pipeline factory is shared, No parallel pipelines

_Verified by: Pipeline factory is shared, No parallel pipelines_

**Domain logic lives in API modules**

**Invariant:** Query logic that operates on MasterDataset lives in
    `src/api/` modules. This makes it programmatically testable, reusable
    by future consumers (e.g. MCP server, watch mode), and aligned with
    the feature-consumption layer defined in ADR-006.

_Verified by: Domain logic in API modules_

---

[← Back to Pattern Registry](../PATTERNS.md)
