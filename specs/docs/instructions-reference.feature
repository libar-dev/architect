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
| File-Level Opt-In | THIS DECISION (Rule: File-Level Opt-In) | Rule block table |
| Category Tags | src/taxonomy/categories.ts | extract-shapes tag |
| Category Reference | THIS DECISION (Rule: Category Tags) | Rule block table |
| Metadata Tags | src/taxonomy/registry-builder.ts | extract-shapes tag |
| Core Metadata | THIS DECISION (Rule: Core Metadata Tags) | Rule block table |
| Relationship Tags | THIS DECISION (Rule: Relationship Tags) | Rule block table |
| Process Metadata | THIS DECISION (Rule: Process Metadata) | Rule block table |
| PRD Tags | THIS DECISION (Rule: PRD and Requirements Tags) | Rule block table |
| Hierarchy Tags | THIS DECISION (Rule: Hierarchy Tags) | Rule block table |
| ADR/PDR Tags | THIS DECISION (Rule: ADR and PDR Tags) | Rule block table |
| Traceability Tags | THIS DECISION (Rule: Traceability Tags) | Rule block table |
| Architecture Tags | THIS DECISION (Rule: Architecture Diagram Tags) | Rule block table |
| Aggregation Tags | THIS DECISION (Rule: Aggregation Tags) | Rule block table |
| generate-docs CLI | src/cli/generate-docs.ts | extract-shapes tag |
| lint-patterns CLI | src/cli/lint-patterns.ts | extract-shapes tag |
| lint-process CLI | src/cli/lint-process.ts | extract-shapes tag |
| validate-patterns CLI | src/cli/validate-patterns.ts | extract-shapes tag |
| generate-tag-taxonomy CLI | src/cli/generate-tag-taxonomy.ts | extract-shapes tag |
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

    **Full Category Table (ddd-es-cqrs preset - 21 categories):**

| Tag | Domain | Priority | Description |
| --- | --- | --- | --- |
| domain | Strategic DDD | 1 | Bounded contexts, aggregates, strategic design |
| ddd | Domain-Driven Design | 2 | DDD tactical patterns |
| bounded-context | Bounded Context | 3 | BC contracts and definitions |
| event-sourcing | Event Sourcing | 4 | Event store, aggregates, replay |
| decider | Decider | 5 | Decider pattern |
| fsm | FSM | 5 | Finite state machine patterns |
| cqrs | CQRS | 5 | Command/query separation |
| projection | Projection | 6 | Read models, checkpoints |
| saga | Saga | 7 | Cross-context coordination, process managers |
| command | Command | 8 | Command handlers, orchestration |
| arch | Architecture | 9 | Architecture patterns, decisions |
| infra | Infrastructure | 10 | Infrastructure, composition root |
| validation | Validation | 11 | Input validation, schemas |
| testing | Testing | 12 | Test patterns, BDD |
| performance | Performance | 13 | Optimization, caching |
| security | Security | 14 | Auth, authorization |
| core | Core | 15 | Core utilities |
| api | API | 16 | Public APIs |
| generator | Generator | 17 | Code generators |
| middleware | Middleware | 18 | Middleware patterns |
| correlation | Correlation | 19 | Correlation tracking |

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

  Rule: Core Metadata Tags

    **Context:** Core metadata tags provide essential pattern information.

| Tag | Format | Purpose | Example |
| --- | --- | --- | --- |
| pattern | value | Explicit pattern name (required) | at-libar-docs-pattern CommandOrchestrator |
| status | enum | Work item lifecycle status (per FSM) | at-libar-docs-status roadmap |
| core | flag | Marks as essential/must-know pattern | at-libar-docs-core |
| usecase | quoted-value | Use case association (repeatable) | at-libar-docs-usecase "When handling failures" |
| brief | value | Path to pattern brief markdown | at-libar-docs-brief docs/briefs/decider.md |

    **Status Values:** roadmap, active, completed, deferred

    **Format Types:**

| Format | Parsing | Example |
| --- | --- | --- |
| flag | Boolean presence (no value) | at-libar-docs-core |
| value | Simple string | at-libar-docs-pattern MyPattern |
| enum | Constrained to predefined list | at-libar-docs-status completed |
| csv | Comma-separated values | at-libar-docs-uses A, B, C |
| number | Numeric value | at-libar-docs-phase 15 |
| quoted-value | Preserves spaces | at-libar-docs-brief:'Multi word' |

  Rule: Relationship Tags

    **Context:** Relationship tags model pattern dependencies and connections.

| Tag | Format | Purpose | Example |
| --- | --- | --- | --- |
| uses | csv | Patterns this depends on | at-libar-docs-uses CommandBus, EventStore |
| used-by | csv | Patterns that depend on this | at-libar-docs-used-by SagaOrchestrator |
| implements | csv | Patterns this code realizes | at-libar-docs-implements EventStoreDurability |
| extends | value | Base pattern this extends | at-libar-docs-extends ProjectionCategories |
| depends-on | csv | Roadmap dependencies | at-libar-docs-depends-on EventStore, CommandBus |
| enables | csv | Patterns this enables | at-libar-docs-enables SagaOrchestrator |
| see-also | csv | Related patterns (no dependency) | at-libar-docs-see-also AgentAsBoundedContext |
| api-ref | csv | File paths to implementation APIs | at-libar-docs-api-ref src/durability/outbox.ts |

    **Source Ownership:**

| Tag | Correct Location | Wrong Location |
| --- | --- | --- |
| uses | TypeScript | Feature files |
| depends-on | Feature files | TypeScript |

  Rule: Process Metadata

    **Context:** Process metadata tracks work timeline and assignment.

| Tag | Format | Purpose | Example |
| --- | --- | --- | --- |
| phase | number | Roadmap phase number | at-libar-docs-phase 14 |
| release | value | Target release version | at-libar-docs-release v0.1.0 |
| quarter | value | Delivery quarter | at-libar-docs-quarter Q1-2026 |
| completed | value | Completion date (YYYY-MM-DD) | at-libar-docs-completed 2026-01-08 |
| effort | value | Estimated effort | at-libar-docs-effort 2d |
| effort-actual | value | Actual effort spent | at-libar-docs-effort-actual 3d |
| team | value | Responsible team | at-libar-docs-team platform |
| workflow | enum | Workflow discipline | at-libar-docs-workflow implementation |
| risk | enum | Risk level | at-libar-docs-risk medium |
| priority | enum | Priority level | at-libar-docs-priority high |

    **Enum Values:**

| Tag | Values |
| --- | --- |
| workflow | implementation, planning, validation, documentation |
| risk | low, medium, high |
| priority | critical, high, medium, low |

  Rule: PRD and Requirements Tags

    **Context:** PRD tags support product requirements documentation.

| Tag | Format | Purpose | Example |
| --- | --- | --- | --- |
| product-area | value | Product area for PRD grouping | at-libar-docs-product-area PlatformCore |
| user-role | value | Target user persona | at-libar-docs-user-role Developer |
| business-value | value | Business value statement | at-libar-docs-business-value eliminates-complexity |
| constraint | value | Technical constraint (repeatable) | at-libar-docs-constraint requires-convex-backend |

    **Note:** Business value uses hyphenated format for tag compatibility.

  Rule: Hierarchy Tags

    **Context:** Hierarchy tags organize work into epic, phase, task structure.

| Tag | Format | Purpose | Example |
| --- | --- | --- | --- |
| level | enum | Hierarchy level | at-libar-docs-level epic |
| parent | value | Parent pattern in hierarchy | at-libar-docs-parent AggregateArchitecture |

    **Hierarchy Levels:**

| Level | Duration | Description |
| --- | --- | --- |
| epic | Multi-quarter | Strategic initiatives |
| phase | 2-5 days | Standard work units |
| task | 1-4 hours | Session-level work |

  Rule: ADR and PDR Tags

    **Context:** ADR/PDR tags support architecture decision records.

| Tag | Format | Purpose | Example |
| --- | --- | --- | --- |
| adr | value | ADR/PDR number | at-libar-docs-adr 015 |
| adr-status | enum | Decision status | at-libar-docs-adr-status accepted |
| adr-category | value | Category (architecture, process) | at-libar-docs-adr-category architecture |
| adr-supersedes | value | ADR number this supersedes | at-libar-docs-adr-supersedes 012 |
| adr-superseded-by | value | ADR that supersedes this | at-libar-docs-adr-superseded-by 020 |
| adr-theme | enum | Theme grouping | at-libar-docs-adr-theme persistence |
| adr-layer | enum | Evolutionary layer | at-libar-docs-adr-layer foundation |

    **Enum Values:**

| Tag | Values |
| --- | --- |
| adr-status | proposed, accepted, deprecated, superseded |
| adr-theme | persistence, isolation, commands, projections, coordination, taxonomy, testing |
| adr-layer | foundation, infrastructure, refinement |

  Rule: Traceability Tags

    **Context:** Traceability tags link roadmap specs to executable specs (PDR-007).

| Tag | Format | Purpose | Example |
| --- | --- | --- | --- |
| executable-specs | csv | Links to package spec locations | at-libar-docs-executable-specs platform-decider/tests/features |
| roadmap-spec | value | Links back to roadmap pattern | at-libar-docs-roadmap-spec DeciderPattern |

    **Two-Tier Spec Architecture:**

| Tier | Location | Purpose |
| --- | --- | --- |
| Tier 1 | delivery-process/specs/ | Roadmap and planning specifications |
| Tier 2 | package/tests/features/ | Executable test specifications |

  Rule: Architecture Diagram Tags

    **Context:** Architecture tags enable automated diagram generation.

| Tag | Format | Purpose | Example |
| --- | --- | --- | --- |
| arch-role | enum | Architectural role for diagrams | at-libar-docs-arch-role projection |
| arch-context | value | Bounded context for grouping | at-libar-docs-arch-context orders |
| arch-layer | enum | Architectural layer | at-libar-docs-arch-layer application |

    **Arch-Role Values:**

| Role | Description |
| --- | --- |
| bounded-context | BC boundary |
| command-handler | Command processing |
| projection | Read model |
| saga | Cross-context coordination |
| process-manager | Long-running process |
| infrastructure | Infrastructure component |
| repository | Data access |
| decider | Decider pattern |
| read-model | Query model |

    **Arch-Layer Values:** domain, application, infrastructure

  Rule: Shape Extraction Tag

    **Context:** Extract TypeScript types for documentation generation (ADR-021).

| Tag | Format | Purpose | Example |
| --- | --- | --- | --- |
| extract-shapes | csv | TypeScript type names to extract | at-libar-docs-extract-shapes DeciderInput, Result |

    **Usage:** Add to files containing types that should appear in generated docs.

  Rule: Aggregation Tags

    **Context:** Aggregation tags control document output organization.

| Tag | Target Document | Purpose |
| --- | --- | --- |
| overview | OVERVIEW.md | Architecture overview patterns |
| decision | DECISIONS.md | ADR-style decisions (auto-numbered) |
| intro | (template) | Package introduction placeholder |

    **Usage Example:**

    """typescript
    /**
     * at-libar-docs
     * at-libar-docs-pattern ArchitectureOverview
     * at-libar-docs-overview
     */
    """

  Rule: CLI generate-docs

    **Context:** Unified documentation generation CLI.

    **Usage:** generate-docs [options]

| Flag | Description | Default |
| --- | --- | --- |
| -i, --input pattern | Glob patterns for TypeScript files | (required) |
| -e, --exclude pattern | Glob patterns to exclude | (none) |
| -o, --output dir | Output directory | docs/architecture |
| -b, --base-dir dir | Base directory for paths | cwd |
| -g, --generators names | Generators to run | patterns |
| -w, --workflow file | Workflow config JSON file | 6-phase-standard |
| -f, --overwrite | Overwrite existing files | false |
| --features pattern | Glob pattern for .feature files | (none) |
| --list-generators | List available generators and exit | (flag) |
| --git-diff-base branch | Base branch for git diff | (none) |
| --changed-files file | Explicit file list | (none) |
| --release-filter version | Filter by release version | (none) |
| -h, --help | Show help message | (flag) |
| -v, --version | Show version number | (flag) |

    **Examples:**

    """bash
    generate-docs -i "src/**/*.ts" -o docs
    generate-docs -i "src/**/*.ts" -g patterns -g adrs -f
    generate-docs --list-generators
    generate-docs -g pr-changes --git-diff-base main -o docs-living -f
    """

  Rule: CLI lint-patterns

    **Context:** Pattern annotation quality checker.

    **Usage:** lint-patterns [options]

| Flag | Description | Default |
| --- | --- | --- |
| -i, --input pattern | Glob pattern for TypeScript files | (required) |
| -e, --exclude pattern | Glob pattern to exclude | (none) |
| -b, --base-dir dir | Base directory for paths | cwd |
| --strict | Treat warnings as errors | false |
| -f, --format type | Output format (pretty or json) | pretty |
| -q, --quiet | Only show errors | false |
| --min-severity level | Minimum severity (error, warning, info) | info |
| -h, --help | Show help message | (flag) |
| -v, --version | Show version number | (flag) |

    **Lint Rules:**

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

    **Usage:** lint-process [options] [files...]

| Flag | Description | Default |
| --- | --- | --- |
| --staged | Validate staged changes | (default mode) |
| --all | Validate all changes vs main branch | (mode) |
| --files | Validate specific files | (mode) |
| -f, --file path | File to validate (repeatable) | (none) |
| -b, --base-dir dir | Base directory for paths | cwd |
| --strict | Treat warnings as errors | false |
| --ignore-session | Ignore session scope rules | false |
| --show-state | Show derived process state | false |
| --format type | Output format (pretty or json) | pretty |
| -h, --help | Show help message | (flag) |
| -v, --version | Show version number | (flag) |

    **Validation Rules:**

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

    **Usage:** validate-patterns [options]

| Flag | Description | Default |
| --- | --- | --- |
| -i, --input pattern | Glob pattern for TypeScript files | (required) |
| -F, --features pattern | Glob pattern for Gherkin files | (required) |
| -e, --exclude pattern | Glob pattern to exclude | (none) |
| -b, --base-dir dir | Base directory for paths | cwd |
| --strict | Treat warnings as errors (exit 2) | false |
| -f, --format type | Output format (pretty or json) | pretty |
| --dod | Enable Definition of Done validation | false |
| --phase N | Validate specific phase (repeatable) | (all completed) |
| --anti-patterns | Enable anti-pattern detection | false |
| --scenario-threshold N | Max scenarios per feature | 20 |
| --mega-feature-threshold N | Max lines per feature | 500 |
| --magic-comment-threshold N | Max magic comments | 5 |
| -h, --help | Show help message | (flag) |
| -v, --version | Show version number | (flag) |

    **Validation Checks:**

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

    **Usage:** generate-tag-taxonomy [options]

| Flag | Description | Default |
| --- | --- | --- |
| -o, --output path | Output path for TAG_TAXONOMY.md | docs/architecture/TAG_TAXONOMY.md |
| -b, --base-dir dir | Base directory for paths | cwd |
| -f, --overwrite | Overwrite existing file | false |
| -h, --help | Show help message | (flag) |
| -v, --version | Show version number | (flag) |

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
