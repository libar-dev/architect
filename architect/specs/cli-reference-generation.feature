@architect
@architect-pattern:CliReferenceGeneration
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-phase:43
@architect-effort:1d
@architect-product-area:Generation
@architect-depends-on:DocsConsolidationStrategy
@architect-business-value:keeps-cli-reference-tables-in-sync-with-cli-schema-automatically
@architect-priority:low
Feature: CLI.md Hybrid Generation

  **Problem:**
  `docs/CLI.md` (509 lines) contains three reference tables that manually
  mirror CLI definitions in source code: Global Options (lines 382-389, 6 rows),
  Output Modifiers (lines 397-403, 5 rows), and List Filters (lines 415-424, 8 rows).
  These ~41 lines are pure data derived from code constants in `src/cli/pattern-graph-cli.ts`
  and `src/cli/output-pipeline.ts`. When CLI options change, these tables require
  manual updates and risk falling out of sync with the implementation.

  Additionally, the `showHelp()` function (lines 271-370 of `src/cli/pattern-graph-cli.ts`)
  is a hardcoded third copy of the same information, creating three-way drift risk:
  parser code, help text, and markdown tables.

  **Solution:**
  Create a declarative CLI schema (`src/cli/cli-schema.ts`) as the single source of
  truth. A standalone `CliReferenceGenerator` reads this schema and produces
  a complete generated reference file at `docs-live/reference/CLI-REFERENCE.md`.
  The "Output Reference" section in `docs/CLI.md` (lines 376-424) is replaced
  with a heading and link to the generated file. The `showHelp()` function is refactored
  to consume the same schema, eliminating three-way sync.

  **Why It Matters:**
  | Benefit | How |
  | Zero drift | Reference tables regenerate automatically from schema |
  | Three-way sync eliminated | Schema drives both help text and generated docs |
  | Consistent with existing pattern | Same OutputFile approach as ARCHITECTURE-CODECS.md |

  **Design Findings (2026-03-05):**
  | Finding | Impact | Resolution |
  | Original spec references src/cli/parser.ts | File does not exist | Fix to src/cli/pattern-graph-cli.ts + src/cli/output-pipeline.ts |
  | Orchestrator only does full-file writes | Marker-based partial replacement not supported | Split Output Reference into separate generated file |
  | ReferenceDocConfig is PatternGraph-sourced | CLI schema data is not annotation-derived | Standalone generator, not ReferenceDocConfig (ADR-006) |
  | --format in Output Modifiers table but not in OutputModifiers interface | Would produce incomplete table | Schema includes --format alongside modifiers |
  | --session parsed as global option but absent from Global Options table | Intentional, documented in Session Types | Schema captures in separate sessionOptions group |
  | showHelp() lines 271-370 is third copy of same data | Three-way sync risk | Schema drives both help text and doc generation |
  | Inter-table prose is only ~10 lines total | Must appear in generated file | Encode as description/postNote fields in schema |

  **Section Audit — docs/CLI.md (509 lines):**
  | Section | Lines | Action | Rationale |
  | Intro + Why Use This | 1-30 | KEEP | Editorial context |
  | Quick Start | 31-62 | KEEP | Examples with output |
  | Session Types | 65-76 | KEEP | Decision tree |
  | Session Workflow Commands | 80-204 | KEEP | Narrative descriptions |
  | Pattern Discovery | 207-301 | KEEP | Narrative descriptions |
  | Architecture Queries | 305-332 | KEEP | Reference with examples |
  | Metadata and Inventory | 336-374 | KEEP | Command descriptions |
  | Output Reference heading | 376-378 | TRIM | Replace with link to generated file |
  | Global Options table | 380-391 | EXTRACT | Generate from CLI schema |
  | Output Modifiers table | 393-409 | EXTRACT | Generate from CLI schema |
  | List Filters table | 411-424 | EXTRACT | Generate from CLI schema |
  | JSON Envelope | 426-449 | KEEP | Operational reference |
  | Exit Codes | 451-456 | KEEP | Operational reference |
  | JSON Piping | 458-465 | KEEP | Operational tip |
  | Common Recipes | 468-509 | KEEP | Editorial recipes |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Create declarative CLI schema with option groups | complete | src/cli/cli-schema.ts | Yes | unit |
      | Sync test verifying schema entries match parseArgs behavior | complete | tests/features/behavior/cli/ | Yes | integration |
      | CliReferenceGenerator producing complete reference file | complete | src/generators/built-in/cli-reference-generator.ts | Yes | integration |
      | Register generator in orchestrator config | complete | architect.config.ts | Yes | integration |
      | Trim CLI.md Output Reference to link to generated file | complete | docs/CLI.md | Yes | manual |
      | Refactor showHelp to consume CLI schema | complete | src/cli/pattern-graph-cli.ts | Yes | integration |
      | Behavior spec with scenarios for all 3 generated tables | complete | tests/features/behavior/cli/cli-reference.feature | Yes | integration |

  Rule: CLI schema is single source of truth for reference tables

    **Invariant:** A declarative CLI schema in `src/cli/cli-schema.ts` defines all
    global options, output modifiers, and list filters with their flags, descriptions,
    defaults, and value types. The three reference tables in
    `docs-live/reference/CLI-REFERENCE.md` are generated from this schema by
    a standalone `CliReferenceGenerator`. The schema also drives `showHelp()`.

    **Rationale:** CLI options are defined imperatively in `parseArgs()` (lines 132-265
    of `src/cli/pattern-graph-cli.ts`) and `OutputModifiers`/`ListFilters` interfaces
    (lines 43-83 of `src/cli/output-pipeline.ts`). A declarative schema extracts this
    into a single structured definition that both documentation and help text consume.
    The existing `ReferenceDocConfig` system cannot be used because it sources from
    PatternGraph (annotation-derived data), not static constants (ADR-006).

    **Verified by:** Tables match parser definitions, showHelp output matches schema,
    sync test catches drift

    @acceptance-criteria @happy-path
    Scenario: Generated tables match CLI schema definitions
      Given a CLI schema defining global options, output modifiers, and list filters
      When the CliReferenceGenerator runs
      Then CLI-REFERENCE.md contains a Global Options table with all defined flags
      And the table includes flag name, short alias, description, and default columns
      And CLI-REFERENCE.md contains an Output Modifiers table with all defined modifiers
      And CLI-REFERENCE.md contains a List Filters table with all defined filter keys

    @acceptance-criteria @validation
    Scenario: CLI schema stays in sync with parser
      Given a CLI schema entry for each flag recognized by parseArgs
      When a new flag is added to parseArgs without updating the schema
      Then the sync test fails with a mismatch report
      And when the schema is updated to include the new flag
      Then the sync test passes

  Rule: Narrative prose sections remain manual

    **Invariant:** CLI.md sections covering "Why Use This", session type
    decision tree, workflow recipes, worked examples with expected output, and
    "Common Recipes" are not generated. They require editorial judgment and context
    that cannot be extracted from code annotations. The document's value comes from
    these sections — the generated reference tables are supporting material only.

    **Rationale:** Generated docs without prose context would be a bare options
    table — usable as reference but not as a learning resource. The hybrid approach
    gives both: accurate tables from code, readable narrative from editorial work.

    **Verified by:** Prose sections identical after regeneration,
    Tables updated when CLI schema changes

    @acceptance-criteria @validation
    Scenario: Prose sections unchanged after regeneration
      Given CLI.md with narrative sections including "Why Use This" and "Common Recipes"
      When the CliReferenceGenerator runs
      Then CLI.md is not modified by the generator
      And only CLI-REFERENCE.md is created or updated
      And CLI.md contains a link to CLI-REFERENCE.md in the Output Reference section

  Rule: Standalone generator respects ADR-006 single read model

    **Invariant:** The `CliReferenceGenerator` imports CLI schema data directly
    from `src/cli/cli-schema.ts`. It does NOT inject CLI data into PatternGraph or
    consume PatternGraph for table generation. It implements `DocumentGenerator` and
    returns `OutputFile[]` via the standard orchestrator write path.

    **Rationale:** ADR-006 establishes PatternGraph as the sole read model for
    annotation-sourced data. CLI schema is a static TypeScript constant, not extracted
    from annotations. Forcing it through PatternGraph would violate the "no parallel
    pipeline" anti-pattern. A standalone generator with its own data source is
    architecturally correct.

    **Verified by:** Generator has no PatternGraph import, output file written by orchestrator

    @acceptance-criteria @integration
    Scenario: Generator produces complete reference file
      Given the CliReferenceGenerator is registered in the orchestrator
      When docs:all runs
      Then docs-live/reference/CLI-REFERENCE.md is created
      And the file contains three sections: Global Options, Output Modifiers, List Filters
      And each section includes a markdown table with headers and data rows
      And inter-table prose (config auto-detection, valid fields, precedence) is included
