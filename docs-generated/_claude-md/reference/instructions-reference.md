# InstructionsReference

**Purpose:** Compact reference for Claude context
**Detail Level:** summary

---

## Overview

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

### Categories

- `CategoryDefinition` - interface
- `CATEGORIES` - const
- `CategoryTag` - type
- `CATEGORY_TAGS` - const

### Metadata Tags (Grouped)

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
