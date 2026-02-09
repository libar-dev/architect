# InstructionsReference

**Purpose:** Compact reference for Claude context
**Detail Level:** summary

---

## Overview

### Quick Tag Reference

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

### File-Level Opt-In

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

### Category Tags

- `CategoryDefinition` - interface
- `CATEGORIES` - const
- `CategoryTag` - type
- `CATEGORY_TAGS` - const

### Metadata Tags

- `TagRegistry` - interface
- `MetadataTagDefinitionForRegistry` - interface
- `TagDefinition` - type
- `buildRegistry` - function
- `METADATA_TAGS_BY_GROUP` - const

### Format Types

**Context:** Format types define how tag values are parsed.

| Format | Parsing | Example |
| --- | --- | --- |
| flag | Boolean presence (no value) | at-libar-docs-core |
| value | Simple string | at-libar-docs-pattern MyPattern |
| enum | Constrained to predefined list | at-libar-docs-status completed |
| csv | Comma-separated values | at-libar-docs-uses A, B, C |
| number | Numeric value | at-libar-docs-phase 15 |
| quoted-value | Preserves spaces | at-libar-docs-brief:'Multi word' |

### Source Ownership

**Context:** Relationship tags have specific ownership rules.

    Relationship tag definitions are extracted from `src/taxonomy/registry-builder.ts`.
    This table defines WHERE each tag type should be used (architectural guidance):

| Tag | Correct Location | Wrong Location |
| --- | --- | --- |
| uses | TypeScript | Feature files |
| depends-on | Feature files | TypeScript |

    TypeScript files own runtime dependencies (`uses`).
    Feature files own planning dependencies (`depends-on`).

### Hierarchy Duration

**Context:** Hierarchy tags organize work into epic, phase, task structure.
    Tag definitions (level, parent) are extracted from `src/taxonomy/registry-builder.ts`.
    This table provides planning guidance for duration estimates:

| Level | Duration | Description |
| --- | --- | --- |
| epic | Multi-quarter | Strategic initiatives |
| phase | 2-5 days | Standard work units |
| task | 1-4 hours | Session-level work |

### Two-Tier Spec Architecture

**Context:** Traceability tags link roadmap specs to executable specs (PDR-007).
    Tag definitions (executable-specs, roadmap-spec) are in `src/taxonomy/registry-builder.ts`.
    This table explains the two-tier architecture:

| Tier | Location | Purpose |
| --- | --- | --- |
| Tier 1 | delivery-process/specs/ | Roadmap and planning specifications |
| Tier 2 | package/tests/features/ | Executable test specifications |

### CLAUDE.md Generation

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

### AI Context Optimization

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

    **Progressive Disclosure Pattern:**

| Level | Include | Exclude |
| --- | --- | --- |
| Summary | Key facts, quick reference | Examples, edge cases |
| Standard | Core content, common cases | Deep dives, alternatives |
| Detailed | Everything | Nothing |

### CLI generate-docs

- `CLIConfig` - interface

### CLI lint-patterns

- `LintCLIConfig` - interface

### CLI lint-process

- `ProcessGuardCLIConfig` - interface

### CLI validate-patterns

- `ValidateCLIConfig` - interface
- `ValidationIssue` - interface
- `ValidationSummary` - interface

### CLI generate-tag-taxonomy

- `CLIConfig` - interface

### Gherkin Integration

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

### Related Documentation

**Context:** Related documentation for deeper understanding.

| Document | Relationship | Focus |
| --- | --- | --- |
| TAXONOMY-REFERENCE.md | Reference | Tag definitions, categories, status values |
| CONFIGURATION-REFERENCE.md | Reference | Preset system and tag prefix configuration |
| PROCESS-GUARD-REFERENCE.md | Reference | FSM workflow validation rules |
| SESSION-GUIDES-REFERENCE.md | Reference | Session workflows using annotations |
| GHERKIN-PATTERNS-REFERENCE.md | Reference | Feature file structure and patterns |
