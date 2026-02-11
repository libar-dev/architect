@libar-docs
@libar-docs-adr:010
@libar-docs-adr-status:accepted
@libar-docs-adr-category:process
@libar-docs-pattern:ADR010PatternNamingConventions
@libar-docs-phase:99
@libar-docs-status:active
@libar-docs-product-area:Process
@libar-docs-claude-md-section:reference
@libar-docs-convention:pattern-naming,annotation-system
Feature: ADR-010 - Pattern Naming and Annotation Conventions

  **Context:**
  The annotation system uses a tag-based approach where TypeScript JSDoc and Gherkin
  tags drive documentation generation. Without consistent conventions:
  - Tag names vary across files (inconsistent format types)
  - Relationship tags appear in wrong source files (TypeScript vs Gherkin ownership)
  - Hierarchy levels lack defined duration expectations
  - File-level opt-in requirements are unclear to new contributors

  **Decision:**
  Establish standard naming and annotation conventions:
  - File-level opt-in via bare `@libar-docs` marker is mandatory for scanning
  - Tags use defined format types: flag, value, enum, csv, number, quoted-value
  - Relationship tags have source ownership rules (uses in TS, depends-on in Gherkin)
  - Hierarchy levels define duration expectations (epic=multi-quarter, phase=2-5 days)
  - Two-tier spec architecture separates planning from executable specs

  **Consequences:**
  - (+) Consistent annotation patterns across all source files
  - (+) Clear ownership rules prevent cross-source confusion
  - (+) Format types enable precise parsing and validation
  - (+) Anti-pattern detection catches misplaced tags
  - (-) More rules for contributors to learn
  - (-) Existing files may need migration to comply

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Pattern naming decision | complete | delivery-process/decisions/adr-010-pattern-naming-conventions.feature |

  Rule: Quick Tag Reference

    **Context:** Most commonly used tags for quick lookup.

    **Essential Tags (required for most patterns):**

    | Tag | Format | Purpose | Example Value |
    | --- | --- | --- | --- |
    | pattern | value | Pattern identifier | MyPattern |
    | status | enum | FSM state | roadmap, active, completed |
    | phase | number | Roadmap phase | 15 |
    | core | flag | Mark as essential | (no value) |

    **Relationship Tags:**

    | Tag | Format | Source | Purpose |
    | --- | --- | --- | --- |
    | uses | csv | TypeScript | Runtime dependencies |
    | used-by | csv | TypeScript | Reverse dependencies |
    | depends-on | csv | Gherkin | Planning dependencies |
    | enables | csv | Either | What this unlocks |

    **Process Tags:**

    | Tag | Format | Purpose | Example Value |
    | --- | --- | --- | --- |
    | quarter | value | Timeline | Q1-2026 |
    | effort | value | Estimate | 2d, 4h, 1w |
    | team | value | Assignment | platform-team |
    | priority | enum | Urgency | critical, high, medium, low |

  Rule: File-Level Opt-In

    **Context:** Files must explicitly opt-in to be scanned for annotations.

    **Decision:** Add the opt-in marker as the first annotation in a JSDoc comment.

    | Preset | Opt-In Marker | Example |
    | --- | --- | --- |
    | libar-generic | at-libar-docs | JSDoc comment with at-libar-docs |
    | generic | at-docs | JSDoc comment with at-docs |
    | ddd-es-cqrs | at-libar-docs | JSDoc comment with at-libar-docs |

    **Important:** Only files with the opt-in marker are scanned. Files without
    the marker are ignored by the scanner even if they contain other annotations.

  Rule: Category Tags

    **Context:** Category tags classify patterns by domain area.

    The full category list (21 categories in ddd-es-cqrs preset) is extracted from
    `src/taxonomy/categories.ts`. Each category has: tag, domain, priority, description.

    **Simple Presets (generic, libar-generic):** Only core, api, infra categories.

    **Usage:** Add category tag as a flag (no value needed).

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

  Rule: CLAUDE.md Generation

    **Context:** The package generates CLAUDE.md files for AI assistant context.

    **Output Locations:**

    | Format | Location | Purpose |
    | --- | --- | --- |
    | Compact | _claude-md/ subdirectories | Minimal AI context (low token cost) |
    | Detailed | docs/ directory | Full human-readable documentation |

    **Section Routing Tag:** Use `claude-md-section` to route patterns to specific
    _claude-md subdirectories. This organizes AI context by domain.

    **Available Sections:**

    | Section Value | Output Directory | Content Type |
    | --- | --- | --- |
    | index | _claude-md/index/ | Navigation and overview |
    | reference | _claude-md/reference/ | Tag and CLI reference |
    | validation | _claude-md/validation/ | Validation rules and process guard |
    | sessions | _claude-md/sessions/ | Session workflow guides |
    | architecture | _claude-md/architecture/ | System architecture |
    | methodology | _claude-md/methodology/ | Core principles |
    | gherkin | _claude-md/gherkin/ | Gherkin writing patterns |
    | config | _claude-md/config/ | Configuration reference |
    | taxonomy | _claude-md/taxonomy/ | Tag taxonomy |
    | publishing | _claude-md/publishing/ | Publishing guides |

  Rule: AI Context Optimization

    **Context:** Guidelines for writing content that works well in AI assistant context.

    **Compact vs Detailed Format:**

    | Aspect | Compact (AI) | Detailed (Human) |
    | --- | --- | --- |
    | Token budget | Minimize (cost-sensitive) | No limit |
    | Examples | 1-2 essential | Many with variations |
    | Tables | Dense, reference-style | Expanded with context |
    | Prose | Bullet points preferred | Full sentences OK |
    | Code | Minimal snippets | Full implementations |

    **Content Optimization Guidelines:**

    | Guideline | Rationale |
    | --- | --- |
    | Use tables for reference data | Scannable, low tokens |
    | Prefer bullet lists over paragraphs | AI parses structure well |
    | Include concrete examples | Reduces ambiguity |
    | State constraints explicitly | AI follows rules better |
    | Avoid redundant explanations | Every token costs money |

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
  Scenario: ADR generates Instructions Reference documentation
    Given this decision document with convention tags
    When the reference codec processes pattern-naming convention
    Then the output contains tag reference tables and format types
    And source ownership rules and hierarchy levels are present
