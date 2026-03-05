@libar-docs
@libar-docs-pattern:ProcessApiHybridGeneration
@libar-docs-status:roadmap
@libar-docs-phase:43
@libar-docs-effort:1d
@libar-docs-product-area:Generation
@libar-docs-depends-on:DocsConsolidationStrategy
@libar-docs-business-value:keeps-process-api-reference-tables-in-sync-with-cli-schema-automatically
@libar-docs-priority:low
Feature: PROCESS-API.md Hybrid Generation

  **Problem:**
  `docs/PROCESS-API.md` (507 lines) contains three reference tables that manually
  mirror CLI schema definitions in source code: the Global Options table (~10 lines,
  lines 381-391), the Output Modifiers table (~16 lines, lines 393-408), and the
  List Filters table (~15 lines, lines 411-425). These 41 lines are pure data
  derived from code constants. When CLI options change — a new flag is added, a
  default changes, a filter type is extended — these tables require manual updates
  and risk falling out of sync with the implementation.

  **Solution:**
  Adopt a hybrid approach: generate only the three reference table sections from
  `src/cli/parser.ts` definitions, keep all narrative sections hand-written. The
  `preamble` capability (already built) preserves editorial intro sections. A new
  codec reads CLI arg definitions and emits markdown tables for Global Options,
  Output Modifiers, and List Filters. The `docs:all` command replaces only those
  three sections in PROCESS-API.md, leaving all prose untouched.

  **Why It Matters:**
  | Benefit | How |
  | Zero drift | Reference tables regenerate automatically from parser definitions |
  | Pattern consistency | Mirrors Phase 2 (codec listings) and Phase 3 (PROCESS-GUARD tables) |
  | Safe editorial control | cli-patterns convention tag already exists in src/taxonomy/conventions.ts |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Extract CLI option definitions from src/cli/parser.ts | pending | src/cli/parser.ts | Yes | integration |
      | Generate Global Options, Output Modifiers, List Filters tables | pending | src/renderable/codecs/ | Yes | integration |
      | Replace 3 manual tables in PROCESS-API.md with generated sections | pending | docs/PROCESS-API.md | Yes | integration |
      | Configure reference doc output in delivery-process.config.ts | pending | delivery-process.config.ts | Yes | integration |

  Rule: CLI reference tables are generated from parser schema

    **Invariant:** The three reference tables (Global Options, Output Modifiers,
    List Filters) in PROCESS-API.md are generated from `src/cli/parser.ts`. All
    narrative sections (Why Use This, Quick Start, Session Types, Command
    descriptions, Common Recipes) remain hand-written. The document combines
    generated tables with preamble-delivered editorial prose.

    **Rationale:** The `cli-patterns` convention tag already exists in
    `src/taxonomy/conventions.ts`. CLI options are defined as code constants —
    maintaining a separate markdown copy creates drift risk. When a new --format
    option or filter is added to the CLI, the markdown table should update
    automatically on the next `docs:all` run.

    **Verified by:** Tables match parser definitions, Narrative sections unchanged,
    pnpm docs:all updates tables

    @acceptance-criteria @happy-path
    Scenario: Generated tables match CLI parser definitions
      Given src/cli/parser.ts with defined global options, output modifiers, and list filters
      When pnpm docs:all runs
      Then the Global Options table in PROCESS-API.md contains all defined flags with correct types and defaults
      And the Output Modifiers table contains all defined modifiers with descriptions
      And the List Filters table contains all defined filter keys with accepted values

  Rule: Narrative prose sections remain manual

    **Invariant:** PROCESS-API.md sections covering "Why Use This", session type
    decision tree, workflow recipes, worked examples with expected output, and
    "Common Recipes" are not generated. They require editorial judgment and context
    that cannot be extracted from code annotations. The document's value comes from
    these sections — the tables are supporting reference only.

    **Rationale:** Generated docs without prose context would be a bare options
    table — usable as reference but not as a learning resource. The hybrid approach
    gives both: accurate tables from code, readable narrative from editorial work.

    **Verified by:** Prose sections identical after regeneration,
    Tables updated when CLI schema changes

    @acceptance-criteria @validation
    Scenario: Prose sections unchanged after regeneration
      Given narrative sections in PROCESS-API.md including "Why Use This" and "Common Recipes"
      When pnpm docs:all runs
      Then the "Why Use This" section is unchanged
      And the "Common Recipes" section is unchanged
      And only the Global Options, Output Modifiers, and List Filters table sections are regenerated
