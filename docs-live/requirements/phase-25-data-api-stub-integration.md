# ✅ Data API Stub Integration

**Purpose:** Detailed requirements for the Data API Stub Integration feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Product Area | DataAPI |
| Business Value | unlock design session stub metadata |
| Phase | 25 |

## Description

**Problem:**
  Design sessions produce code stubs in `delivery-process/stubs/` with rich
  metadata: `@target` (destination file path), `@since` (design session ID),
  `@see` (PDR references), and `AD-N` numbered decisions. But 14 of 22 stubs
  lack the libar-docs opt-in marker, making them invisible to the scanner pipeline.
  The 8 stubs that ARE scanned silently drop the target and see annotations because
  they are not prefixed with the libar-docs namespace.

  This means: the richest source of design context (stubs with architectural
  decisions, target paths, and session provenance) is invisible to the API.

  **Solution:**
  A two-phase integration approach:
  1. **Phase A (Annotation):** Add the libar-docs opt-in + implements tag to
     the 14 non-annotated stubs. This makes them scannable with zero pipeline changes.
  2. **Phase B (Taxonomy):** Register libar-docs-target and libar-docs-since
     as new taxonomy tags. Rename existing `@target` and `@since` annotations in
     all stubs. This gives structured access to stub-specific metadata.

  Then add query commands:
  - `stubs [pattern]` lists design stubs with target paths
  - `decisions [pattern]` surfaces PDR references and AD-N items
  - `pdr <number>` finds all patterns referencing a specific PDR

  **Business Value:**
  | Benefit | Impact |
  | 14 invisible stubs become visible | Full design context available to API |
  | Target path tracking | Know where stubs will be implemented |
  | Design decision queries | Surface AD-N decisions for review |
  | PDR cross-referencing | Find all patterns related to a decision |

## Acceptance Criteria

**Annotated stubs are discoverable by the scanner**

- Given stub files with @libar-docs and @libar-docs-implements tags
- When running the scanner pipeline with stubs input glob
- Then all annotated stubs appear in the MasterDataset
- And each stub has an implementsPatterns relationship

**Stub target path is extracted as structured field**

- Given a stub with "@libar-docs-target:platform-core/src/agent/router.ts"
- When the stub is scanned and extracted
- Then the pattern's targetPath field contains "platform-core/src/agent/router.ts"
- And the targetPath is available via ProcessStateAPI queries

**Stub without libar-docs opt-in is invisible to scanner**

- Given a stub file without the @libar-docs marker
- When running the scanner pipeline with stubs input glob
- Then the stub does NOT appear in the MasterDataset
- And no error is raised for the missing marker

**List all stubs with implementation status**

- Given stubs exist for 4 patterns with targets
- When running "process-api stubs"
- Then the output lists each stub with its target path
- And each stub shows whether the target file exists
- And stubs are grouped by parent pattern

**List stubs for a specific pattern**

- Given 5 stubs implement "AgentCommandInfrastructure"
- When running "process-api stubs AgentCommandInfrastructure"
- Then only stubs for that pattern are returned
- And each stub shows target, session, and implementation status

**Filter unresolved stubs**

- Given 3 stubs with existing targets and 2 without
- When running "process-api stubs --unresolved"
- Then only the 2 stubs without existing target files are returned

**Stubs for nonexistent pattern returns empty result**

- Given no stubs implement "NonExistentPattern"
- When running "process-api stubs NonExistentPattern"
- Then the result is empty
- And the error message suggests checking the pattern name

**Query design decisions for a pattern**

- Given stubs for "AgentCommandInfrastructure" with AD-N items
- When running "process-api decisions AgentCommandInfrastructure"
- Then the output lists each AD-N decision with its description
- And the output shows referenced PDR numbers
- And the output shows the source design session

**Cross-reference a PDR number**

- Given patterns and stubs referencing "PDR-012"
- When running "process-api pdr 012"
- Then the output lists all patterns referencing PDR-012
- And the output shows the decision feature file location
- And the output shows stub count per pattern

**PDR query for nonexistent number returns empty**

- Given no patterns or stubs reference "PDR-999"
- When running "process-api pdr 999"
- Then the result indicates no references found
- And the output includes "No patterns reference PDR-999"

## Business Rules

**All stubs are visible to the scanner pipeline**

**Invariant:** Every stub file in `delivery-process/stubs/` has `@libar-docs`
    opt-in and `@libar-docs-implements` linking it to its parent pattern.

    **Rationale:** The scanner requires `@libar-docs` opt-in marker to include a
    file. Without it, stubs are invisible regardless of other annotations. The
    `@libar-docs-implements` tag creates the bidirectional link: spec defines the
    pattern (via `@libar-docs-pattern`), stub implements it. Per PDR-009, stubs
    must NOT use `@libar-docs-pattern` -- that belongs to the feature file.

    **Boundary note:** Phase A (annotating stubs with libar-docs opt-in and
    libar-docs-implements tags) is consumer-side work done in each consuming repo.
    Package.json scan paths (`-i 'delivery-process/stubs/**/*.ts'`) are already
    pre-configured in 15 scripts. This spec covers Phase B: taxonomy tag
    registration (libar-docs-target, libar-docs-since) and CLI query subcommands.

    **Verified by:** All stubs scanned, Stub metadata extracted

_Verified by: Annotated stubs are discoverable by the scanner, Stub target path is extracted as structured field, Stub without libar-docs opt-in is invisible to scanner_

**Stubs subcommand lists design stubs with implementation status**

**Invariant:** `stubs` returns stub files with their target paths, design
    session origins, and whether the target file already exists.

    **Rationale:** Before implementation, agents need to know: which stubs
    exist for a pattern, where they should be moved to, and which have already
    been implemented. The stub-to-implementation resolver compares
    `@libar-docs-target` paths against actual files to determine status.

    **Output per stub:**
    | Field | Source |
    | Stub file | Pattern filePath |
    | Target | @libar-docs-target value |
    | Implemented? | Target file exists? |
    | Since | @libar-docs-since (design session ID) |
    | Pattern | @libar-docs-implements value |

    **Verified by:** List all stubs, List stubs for pattern, Filter unresolved

_Verified by: List all stubs with implementation status, List stubs for a specific pattern, Filter unresolved stubs, Stubs for nonexistent pattern returns empty result_

**Decisions and PDR commands surface design rationale**

**Invariant:** Design decisions (AD-N items) and PDR references from stub
    annotations are queryable by pattern name or PDR number.

    **Rationale:** Design sessions produce numbered decisions (AD-1, AD-2, etc.)
    and reference PDR decision records (see PDR-012). When reviewing designs
    or starting implementation, agents need to find these decisions without
    reading every stub file manually.

    **decisions output:**
    ```
    Pattern: AgentCommandInfrastructure
    Source: DS-4 (stubs/agent-command-routing/)
    Decisions:
      AD-1: Unified action model (PDR-011)
      AD-5: Router maps command types to orchestrator (PDR-012)
    PDRs referenced: PDR-011, PDR-012
    ```

    **pdr output:**
    ```
    PDR-012: Agent Command Routing
    Referenced by:
      AgentCommandInfrastructure (5 stubs)
      CommandRouter (spec)
    Decision file: decisions/pdr-012-agent-command-routing.feature
    ```

    **Verified by:** Decisions for pattern, PDR cross-reference

_Verified by: Query design decisions for a pattern, Cross-reference a PDR number, PDR query for nonexistent number returns empty_

## Deliverables

- Scan path configuration (pre-existing) (complete)
- libar-docs-target taxonomy tag (complete)
- libar-docs-since taxonomy tag (complete)
- stubs subcommand (complete)
- decisions subcommand (complete)
- pdr subcommand (complete)
- Stub-to-implementation resolver (complete)

## Implementations

Files that implement this pattern:

- [`stub-resolver.ts`](../../delivery-process/stubs/data-api-stub-integration/stub-resolver.ts) - ## StubResolver — Design Stub Discovery and Resolution
- [`stub-resolver.ts`](../../src/api/stub-resolver.ts) - ## StubResolver — Design Stub Discovery and Resolution

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
