@libar-docs
@libar-docs-pattern:InstructionsReference
@libar-docs-status:roadmap
@libar-docs-phase:99
@libar-docs-core
@libar-docs-claude-md-section:reference
Feature: Instructions Reference - Auto-Generated Documentation

  **Problem:**
  Developers need comprehensive reference documentation for all tags and CLI commands.
  The tag system includes file-level opt-in, 21 category tags, numerous metadata tags,
  aggregation tags, and 5 CLI tools. Maintaining this manually leads to drift.

  **Solution:**
  Auto-generate the Instructions reference documentation from annotated source code.
  Tag definitions in src/taxonomy/ and CLI flags in src/cli/ become the source of truth.
  Documentation is a projection of the implementation, always in sync.

  **Target Documents:**

| Output | Purpose | Detail Level |
| docs-generated/docs/INSTRUCTIONSREFERENCE.md | Detailed human reference | detailed |
| docs-generated/_claude-md/reference/instructionsreference.md | Compact AI context | summary |

  **Source Mapping:**

| Section | Source File | Extraction Method |
| --- | --- | --- |
| File-Level Opt-In | THIS DECISION (Rule: File-Level Opt-In) | Rule block content |
| Category Tags | src/taxonomy/categories.ts | extract-shapes tag |
| Metadata Tags | src/taxonomy/registry-builder.ts | extract-shapes tag |
| Format Types | THIS DECISION (Rule: Format Types) | Rule block table |
| Source Ownership | THIS DECISION (Rule: Source Ownership) | Rule block table |
| Hierarchy Duration | THIS DECISION (Rule: Hierarchy Duration) | Rule block table |
| Two-Tier Spec Architecture | THIS DECISION (Rule: Two-Tier Spec Architecture) | Rule block table |
| CLI generate-docs | src/cli/generate-docs.ts | extract-shapes tag |
| CLI lint-patterns | src/cli/lint-patterns.ts | extract-shapes tag |
| CLI lint-process | src/cli/lint-process.ts | extract-shapes tag |
| CLI validate-patterns | src/cli/validate-patterns.ts | extract-shapes tag |
| CLI generate-tag-taxonomy | src/cli/generate-tag-taxonomy.ts | extract-shapes tag |
| Gherkin Integration | THIS DECISION (Rule: Gherkin Integration) | Rule block content |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Instructions reference feature file | Complete | specs/docs/instructions-reference.feature |
      | Source annotations added | Complete | src/taxonomy/*.ts, src/cli/*.ts |
      | Generated detailed docs | Pending | docs-generated/docs/INSTRUCTIONSREFERENCE.md |
      | Generated compact docs | Pending | docs-generated/_claude-md/reference/instructionsreference.md |

  Rule: File-Level Opt-In

    **Context:** Files must explicitly opt-in to be scanned for annotations.

    **Decision:** Add the opt-in marker as the first annotation in a JSDoc comment.

| Preset | Opt-In Marker | Example |
| --- | --- | --- |
| libar-generic | at-libar-docs | JSDoc comment with at-libar-docs |
| generic | at-docs | JSDoc comment with at-docs |
| ddd-es-cqrs | at-libar-docs | JSDoc comment with at-libar-docs |

    **Usage Example:**

    """typescript
    /**
     * at-libar-docs
     * at-libar-docs-pattern PatternScanner
     * at-libar-docs-status completed
     *
     * Description goes here after the annotations.
     */
    export function scanPatterns(config: ScanConfig): Promise<ScanResult> {
      // Implementation
    }
    """

    **Important:** Only files with the opt-in marker are scanned. Files without
    the marker are ignored by the scanner even if they contain other annotations.

  Rule: Category Tags

    **Context:** Category tags classify patterns by domain area.

    The full category list (21 categories in ddd-es-cqrs preset) is extracted from
    `src/taxonomy/categories.ts`. Each category has: tag, domain, priority, description.

    **Simple Presets (generic, libar-generic):** Only core, api, infra categories.

    **Usage:** Add category tag as a flag (no value needed).

    """typescript
    /**
     * at-libar-docs
     * at-libar-docs-pattern DeciderPattern
     * at-libar-docs-decider
     * at-libar-docs-event-sourcing
     */
    """

  Rule: Metadata Tags

    **Context:** Metadata tags are extracted from `src/taxonomy/registry-builder.ts`.
    The `METADATA_TAGS_BY_GROUP` constant organizes all 42 tags into functional groups:
    core, relationship, process, prd, adr, hierarchy, traceability, architecture, extraction.

    Each tag definition includes: tag name, format, purpose, and example.

    **Status Values:** roadmap, active, completed, deferred

  Rule: Format Types

    **Context:** Format types define how tag values are parsed.

| Format | Parsing | Example |
| --- | --- | --- |
| flag | Boolean presence (no value) | at-libar-docs-core |
| value | Simple string | at-libar-docs-pattern MyPattern |
| enum | Constrained to predefined list | at-libar-docs-status completed |
| csv | Comma-separated values | at-libar-docs-uses A, B, C |
| number | Numeric value | at-libar-docs-phase 15 |
| quoted-value | Preserves spaces | at-libar-docs-brief:'Multi word' |

  Rule: Source Ownership

    **Context:** Relationship tags have specific ownership rules.

    Relationship tag definitions are extracted from `src/taxonomy/registry-builder.ts`.
    This table defines WHERE each tag type should be used (architectural guidance):

| Tag | Correct Location | Wrong Location |
| --- | --- | --- |
| uses | TypeScript | Feature files |
| depends-on | Feature files | TypeScript |

    TypeScript files own runtime dependencies (`uses`).
    Feature files own planning dependencies (`depends-on`).

  Rule: Hierarchy Duration

    **Context:** Hierarchy tags organize work into epic, phase, task structure.
    Tag definitions (level, parent) are extracted from `src/taxonomy/registry-builder.ts`.
    This table provides planning guidance for duration estimates:

| Level | Duration | Description |
| --- | --- | --- |
| epic | Multi-quarter | Strategic initiatives |
| phase | 2-5 days | Standard work units |
| task | 1-4 hours | Session-level work |

  Rule: Two-Tier Spec Architecture

    **Context:** Traceability tags link roadmap specs to executable specs (PDR-007).
    Tag definitions (executable-specs, roadmap-spec) are in `src/taxonomy/registry-builder.ts`.
    This table explains the two-tier architecture:

| Tier | Location | Purpose |
| --- | --- | --- |
| Tier 1 | delivery-process/specs/ | Roadmap and planning specifications |
| Tier 2 | package/tests/features/ | Executable test specifications |

  Rule: CLI generate-docs

    **Context:** Unified documentation generation CLI.

    Configuration interface (`CLIConfig`) extracted from `src/cli/generate-docs.ts`.
    Property descriptions appear in generated output with each flag.

    **Examples:**

    """bash
    generate-docs -i "src/**/*.ts" -o docs
    generate-docs -i "src/**/*.ts" -g patterns -g adrs -f
    generate-docs --list-generators
    generate-docs -g pr-changes --git-diff-base main -o docs-living -f
    """

  Rule: CLI lint-patterns

    **Context:** Pattern annotation quality checker.

    Configuration interface (`LintCLIConfig`) extracted from `src/cli/lint-patterns.ts`.
    Property descriptions appear in generated output with each flag.

    **Lint Rules (supplementary):**

| Severity | Rule | Description |
| --- | --- | --- |
| error | missing-pattern-name | Pattern must have pattern name |
| error | tautological-description | Description should not repeat pattern name |
| warning | missing-status | Pattern should have status |
| warning | missing-when-to-use | Pattern should have When to Use section |
| info | missing-relationships | Consider adding uses/used-by tags |

    **Exit Codes:** 0 = no errors, 1 = errors (or warnings with --strict)

  Rule: CLI lint-process

    **Context:** Process Guard linter for delivery workflow validation.

    Configuration interface (`ProcessGuardCLIConfig`) extracted from `src/cli/lint-process.ts`.
    Property descriptions appear in generated output with each flag.

    **Validation Rules (supplementary):**

| Severity | Rule | Description |
| --- | --- | --- |
| error | completed-protection | Cannot modify completed specs without unlock-reason |
| error | invalid-status-transition | Status transition must follow FSM |
| error | scope-creep | Cannot add deliverables to active specs |
| error | session-excluded | Cannot modify files excluded from session |
| warning | session-scope | File not in active session scope |
| warning | deliverable-removed | Deliverable was removed |

    **Exit Codes:** 0 = no errors, 1 = errors (or warnings with --strict)

  Rule: CLI validate-patterns

    **Context:** Cross-source pattern validator for TypeScript vs Gherkin.

    Configuration interface (`ValidateCLIConfig`) extracted from `src/cli/validate-patterns.ts`.
    Property descriptions appear in generated output with each flag.

    **Validation Checks (supplementary):**

| Severity | Rule | Description |
| --- | --- | --- |
| error | phase-mismatch | Phase number differs between sources |
| error | status-mismatch | Status differs between sources |
| warning | missing-pattern-in-gherkin | Pattern in TypeScript has no feature |
| warning | missing-deliverables | Completed phase has no deliverables |
| info | missing-pattern-in-ts | Pattern in Gherkin has no TypeScript |

    **Exit Codes:** 0 = no issues, 1 = errors, 2 = warnings (with --strict)

  Rule: CLI generate-tag-taxonomy

    **Context:** Tag registry documentation generator (deprecated).

    Configuration interface (`CLIConfig`) extracted from `src/cli/generate-tag-taxonomy.ts`.
    Property descriptions appear in generated output with each flag.

    **Note:** This CLI is deprecated. Use pnpm docs:taxonomy instead for
    codec-based generation with progressive disclosure and domain grouping.

  Rule: Gherkin Integration

    **Context:** Gherkin feature files serve as both executable specs and documentation source.

    **File-Level Tags (at top of .feature file):**

| Tag | Purpose | Example |
| --- | --- | --- |
| at-libar-docs | Opt-in marker | First line in tag block |
| at-libar-docs-pattern:Name | Pattern identifier | at-libar-docs-pattern:ProcessGuardLinter |
| at-libar-docs-status:value | FSM status | at-libar-docs-status:roadmap |
| at-libar-docs-phase:N | Phase number | at-libar-docs-phase:99 |

    **Background Deliverables Table:**

    Use a Background section with a DataTable to define deliverables. The table
    must have columns: Deliverable, Status, Location.

    **Rule Block Structure:**

| Component | Purpose |
| --- | --- |
| Rule: Name | Groups related scenarios |
| Invariant header | States the business rule |
| Rationale header | Explains why the rule exists |
| Verified by header | References scenarios that verify the rule |

    **Scenario Tags:**

| Tag | Purpose |
| --- | --- |
| at-happy-path | Primary success scenario |
| at-edge-case | Boundary conditions |
| at-error-handling | Error recovery |
| at-validation | Input validation |
| at-acceptance-criteria | Required for DoD validation |
| at-integration | Cross-component behavior |

    **Feature Description Patterns:**

| Structure | Headers | Best For |
| --- | --- | --- |
| Problem/Solution | Problem and Solution | Pain point to fix |
| Value-First | Business Value and How It Works | TDD-style specs |
| Context/Approach | Context and Approach | Technical patterns |

  @acceptance-criteria
  Scenario: Reference generates Instructions documentation
    Given this decision document with source mapping table
    When running doc-from-decision generator
    Then detailed docs are generated with all tag definitions
    And compact docs are generated with essential reference
    And TypeScript types are extracted from source files
    And CLI flags tables are included for all 5 tools
    And Gherkin integration examples are included
