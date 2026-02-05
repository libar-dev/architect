# InstructionsReference

**Purpose:** Full documentation generated from decision document
**Detail Level:** detailed

---

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

---

## Implementation Details

### File-Level Opt-In

**Context:** Files must explicitly opt-in to be scanned for annotations.

    **Decision:** Add the opt-in marker as the first annotation in a JSDoc comment.

| Preset | Opt-In Marker | Example |
| --- | --- | --- |
| libar-generic | at-libar-docs | JSDoc comment with at-libar-docs |
| generic | at-docs | JSDoc comment with at-docs |
| ddd-es-cqrs | at-libar-docs | JSDoc comment with at-libar-docs |

    **Usage Example:**

```typescript
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
```

**Important:** Only files with the opt-in marker are scanned. Files without
    the marker are ignored by the scanner even if they contain other annotations.

### Category Tags

```typescript
/**
 * @libar-docs
 * @libar-docs-pattern CategoryDefinitions
 * @libar-docs-status completed
 * @libar-docs-core
 * @libar-docs-extract-shapes CategoryDefinition, CATEGORIES, CategoryTag, CATEGORY_TAGS
 *
 * ## Category Definitions
 *
 * Categories are used to classify patterns and organize documentation.
 * Priority determines display order (lower = higher priority).
 * The ddd-es-cqrs preset includes all 21 categories; simpler presets use subsets.
 */
interface CategoryDefinition {
  /** Category tag name without prefix (e.g., "core", "api", "ddd", "saga") */
  readonly tag: string;
  /** Human-readable domain name for display (e.g., "Strategic DDD", "Event Sourcing") */
  readonly domain: string;
  /** Display order priority - lower values appear first in sorted output */
  readonly priority: number;
  /** Brief description of the category's purpose and typical patterns */
  readonly description: string;
  /** Alternative tag names that map to this category (e.g., "es" for "event-sourcing") */
  readonly aliases: readonly string[];
}
```

| Property | Description |
| --- | --- |
| `tag` | Category tag name without prefix (e.g., "core", "api", "ddd", "saga") |
| `domain` | Human-readable domain name for display (e.g., "Strategic DDD", "Event Sourcing") |
| `priority` | Display order priority - lower values appear first in sorted output |
| `description` | Brief description of the category's purpose and typical patterns |
| `aliases` | Alternative tag names that map to this category (e.g., "es" for "event-sourcing") |

```typescript
/**
 * All category definitions for the monorepo
 */
const CATEGORIES: readonly CategoryDefinition[];
```

```typescript
/**
 * Category tags as a union type
 */
type CategoryTag = (typeof CATEGORIES)[number]['tag'];
```

```typescript
/**
 * Extract all category tags as an array
 */
CATEGORY_TAGS = CATEGORIES.map((c) => c.tag) as readonly CategoryTag[]
```

### Metadata Tags

```typescript
/**
 * TagRegistry interface (matches schema from validation-schemas/tag-registry.ts)
 */
interface TagRegistry {
  /** Schema version for forward/backward compatibility checking */
  version: string;
  /** Category definitions for classifying patterns by domain (e.g., core, api, ddd) */
  categories: readonly CategoryDefinitionForRegistry[];
  /** Metadata tag definitions with format, purpose, and validation rules */
  metadataTags: readonly MetadataTagDefinitionForRegistry[];
  /** Aggregation tag definitions for document-level grouping */
  aggregationTags: readonly AggregationTagDefinitionForRegistry[];
  /** Available format options for documentation output */
  formatOptions: readonly string[];
  /** Prefix for all tags (e.g., "@libar-docs-") */
  tagPrefix: string;
  /** File-level opt-in marker tag (e.g., "@libar-docs") */
  fileOptInTag: string;
}
```

| Property | Description |
| --- | --- |
| `version` | Schema version for forward/backward compatibility checking |
| `categories` | Category definitions for classifying patterns by domain (e.g., core, api, ddd) |
| `metadataTags` | Metadata tag definitions with format, purpose, and validation rules |
| `aggregationTags` | Aggregation tag definitions for document-level grouping |
| `formatOptions` | Available format options for documentation output |
| `tagPrefix` | Prefix for all tags (e.g., "@libar-docs-") |
| `fileOptInTag` | File-level opt-in marker tag (e.g., "@libar-docs") |

```typescript
interface MetadataTagDefinitionForRegistry {
  /** Tag name without prefix (e.g., "pattern", "status", "phase") */
  tag: string;
  /** Value format type determining parsing rules (flag, value, enum, csv, number, quoted-value) */
  format: FormatType;
  /** Human-readable description of the tag's purpose and usage */
  purpose: string;
  /** Whether this tag must be present for valid patterns */
  required?: boolean;
  /** Whether this tag can appear multiple times on a single pattern */
  repeatable?: boolean;
  /** Valid values for enum-type tags (undefined for non-enum formats) */
  values?: readonly string[];
  /** Default value applied when tag is not specified */
  default?: string;
  /** Example usage showing tag syntax (e.g., "@libar-docs-pattern MyPattern") */
  example?: string;
}
```

| Property | Description |
| --- | --- |
| `tag` | Tag name without prefix (e.g., "pattern", "status", "phase") |
| `format` | Value format type determining parsing rules (flag, value, enum, csv, number, quoted-value) |
| `purpose` | Human-readable description of the tag's purpose and usage |
| `required` | Whether this tag must be present for valid patterns |
| `repeatable` | Whether this tag can appear multiple times on a single pattern |
| `values` | Valid values for enum-type tags (undefined for non-enum formats) |
| `default` | Default value applied when tag is not specified |
| `example` | Example usage showing tag syntax (e.g., "@libar-docs-pattern MyPattern") |

```typescript
type TagDefinition = MetadataTagDefinitionForRegistry;
```

```typescript
/**
 * Build the complete tag registry from TypeScript constants
 *
 * This is THE single source of truth for the taxonomy.
 * All consumers should use this function instead of loading JSON.
 */
function buildRegistry(): TagRegistry;
```

```typescript
/**
 * Metadata tags organized by functional group.
 * Used for documentation generation to create organized sections.
 *
 * Groups:
 * - core: Essential pattern identification (pattern, status, core, usecase, brief)
 * - relationship: Pattern dependencies and connections
 * - process: Timeline and assignment tracking
 * - prd: Product requirements documentation
 * - adr: Architecture decision records
 * - hierarchy: Epic/phase/task breakdown
 * - traceability: Two-tier spec architecture links
 * - architecture: Diagram generation tags
 * - extraction: Documentation extraction control
 */
METADATA_TAGS_BY_GROUP = {
  core: ['pattern', 'status', 'core', 'usecase', 'brief'] as const,
  relationship: [
    'uses',
    'used-by',
    'implements',
    'extends',
    'depends-on',
    'enables',
    'see-also',
    'api-ref',
  ] as const,
  process: [
    'phase',
    'release',
    'quarter',
    'completed',
    'effort',
    'effort-actual',
    'team',
    'workflow',
    'risk',
    'priority',
  ] as const,
  prd: ['product-area', 'user-role', 'business-value', 'constraint'] as const,
  adr: [
    'adr',
    'adr-status',
    'adr-category',
    'adr-supersedes',
    'adr-superseded-by',
    'adr-theme',
    'adr-layer',
  ] as const,
  hierarchy: ['level', 'parent'] as const,
  traceability: ['executable-specs', 'roadmap-spec'] as const,
  architecture: ['arch-role', 'arch-context', 'arch-layer'] as const,
  extraction: ['extract-shapes'] as const,
} as const
```

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

```typescript
interface CLIConfig {
  /** Glob patterns for TypeScript input files (-i, --input). Repeatable. */
  input: string[];
  /** Glob patterns to exclude from scanning (-e, --exclude). Repeatable. */
  exclude: string[];
  /** Output directory for generated documentation (-o, --output). Default: docs/architecture */
  output: string;
  /** Base directory for path resolution (-b, --base-dir). Default: cwd */
  baseDir: string;
  /** Generators to run (-g, --generators). Repeatable. Default: patterns */
  generators: string[];
  /** Overwrite existing files (-f, --overwrite). Default: false */
  overwrite: boolean;
  /** Glob patterns for Gherkin feature files (--features). Repeatable. */
  features: string[];
  /** Workflow config JSON file path (-w, --workflow). */
  workflowPath: string | null;
  /** List available generators and exit (--list-generators). */
  listGenerators: boolean;
  /** Show help message (-h, --help). */
  help: boolean;
  /** Show version number (-v, --version). */
  version: boolean;
  /** Base branch for git diff (--git-diff-base). For PR Changes generator. */
  gitDiffBase: string | null;
  /** Explicit list of changed files (--changed-files). For PR Changes generator. */
  changedFiles: string[];
  /** Filter patterns by release version (--release-filter). */
  releaseFilter: string | null;
}
```

| Property | Description |
| --- | --- |
| `input` | Glob patterns for TypeScript input files (-i, --input). Repeatable. |
| `exclude` | Glob patterns to exclude from scanning (-e, --exclude). Repeatable. |
| `output` | Output directory for generated documentation (-o, --output). Default: docs/architecture |
| `baseDir` | Base directory for path resolution (-b, --base-dir). Default: cwd |
| `generators` | Generators to run (-g, --generators). Repeatable. Default: patterns |
| `overwrite` | Overwrite existing files (-f, --overwrite). Default: false |
| `features` | Glob patterns for Gherkin feature files (--features). Repeatable. |
| `workflowPath` | Workflow config JSON file path (-w, --workflow). |
| `listGenerators` | List available generators and exit (--list-generators). |
| `help` | Show help message (-h, --help). |
| `version` | Show version number (-v, --version). |
| `gitDiffBase` | Base branch for git diff (--git-diff-base). For PR Changes generator. |
| `changedFiles` | Explicit list of changed files (--changed-files). For PR Changes generator. |
| `releaseFilter` | Filter patterns by release version (--release-filter). |

### CLI lint-patterns

```typescript
/**
 * CLI configuration
 */
interface LintCLIConfig {
  /** Glob patterns for input files */
  input: string[];
  /** Glob patterns to exclude */
  exclude: string[];
  /** Base directory for path resolution */
  baseDir: string;
  /** Treat warnings as errors */
  strict: boolean;
  /** Output format */
  format: 'pretty' | 'json';
  /** Only show errors (suppress warnings/info) */
  quiet: boolean;
  /** Minimum severity to report */
  minSeverity: LintSeverity;
  /** Show help */
  help: boolean;
  /** Show version */
  version: boolean;
}
```

| Property | Description |
| --- | --- |
| `input` | Glob patterns for input files |
| `exclude` | Glob patterns to exclude |
| `baseDir` | Base directory for path resolution |
| `strict` | Treat warnings as errors |
| `format` | Output format |
| `quiet` | Only show errors (suppress warnings/info) |
| `minSeverity` | Minimum severity to report |
| `help` | Show help |
| `version` | Show version |

### CLI lint-process

```typescript
/**
 * CLI configuration
 */
interface ProcessGuardCLIConfig {
  /** Validation mode */
  mode: ValidationMode;
  /** Specific files to validate (when mode is 'files') */
  files: string[];
  /** Treat warnings as errors */
  strict: boolean;
  /** Ignore session scope rules */
  ignoreSession: boolean;
  /** Show derived process state (debugging) */
  showState: boolean;
  /** Base directory for relative paths */
  baseDir: string;
  /** Output format */
  format: 'pretty' | 'json';
  /** Show help */
  help: boolean;
  /** Show version */
  version: boolean;
}
```

| Property | Description |
| --- | --- |
| `mode` | Validation mode |
| `files` | Specific files to validate (when mode is 'files') |
| `strict` | Treat warnings as errors |
| `ignoreSession` | Ignore session scope rules |
| `showState` | Show derived process state (debugging) |
| `baseDir` | Base directory for relative paths |
| `format` | Output format |
| `help` | Show help |
| `version` | Show version |

### CLI validate-patterns

```typescript
/**
 * CLI configuration
 */
interface ValidateCLIConfig {
  /** Glob patterns for TypeScript input files */
  input: string[];
  /** Glob patterns for Gherkin feature files */
  features: string[];
  /** Glob patterns to exclude */
  exclude: string[];
  /** Base directory for path resolution */
  baseDir: string;
  /** Treat warnings as errors */
  strict: boolean;
  /** Output format */
  format: 'pretty' | 'json';
  /** Show help */
  help: boolean;
  /** Enable DoD validation mode */
  dod: boolean;
  /** Specific phases to validate (empty = all completed phases) */
  phases: number[];
  /** Enable anti-pattern detection */
  antiPatterns: boolean;
  /** Override scenario bloat threshold */
  scenarioBloatThreshold: number;
  /** Override mega-feature line threshold */
  megaFeatureLineThreshold: number;
  /** Override magic comment threshold */
  magicCommentThreshold: number;
  /** Show version */
  version: boolean;
}
```

| Property | Description |
| --- | --- |
| `input` | Glob patterns for TypeScript input files |
| `features` | Glob patterns for Gherkin feature files |
| `exclude` | Glob patterns to exclude |
| `baseDir` | Base directory for path resolution |
| `strict` | Treat warnings as errors |
| `format` | Output format |
| `help` | Show help |
| `dod` | Enable DoD validation mode |
| `phases` | Specific phases to validate (empty = all completed phases) |
| `antiPatterns` | Enable anti-pattern detection |
| `scenarioBloatThreshold` | Override scenario bloat threshold |
| `megaFeatureLineThreshold` | Override mega-feature line threshold |
| `magicCommentThreshold` | Override magic comment threshold |
| `version` | Show version |

```typescript
/**
 * Validation issue
 */
interface ValidationIssue {
  severity: IssueSeverity;
  message: string;
  source: 'typescript' | 'gherkin' | 'cross-source';
  pattern?: string;
  file?: string;
}
```

```typescript
/**
 * Validation summary
 */
interface ValidationSummary {
  issues: ValidationIssue[];
  stats: {
    typescriptPatterns: number;
    gherkinPatterns: number;
    matched: number;
    missingInGherkin: number;
    missingInTypeScript: number;
  };
}
```

### CLI generate-tag-taxonomy

```typescript
/**
 * CLI configuration
 */
interface CLIConfig {
  /** Output path for TAG_TAXONOMY.md (-o, --output). Default: docs/architecture/TAG_TAXONOMY.md */
  output: string;
  /** Base directory for path resolution (-b, --base-dir). Default: cwd */
  baseDir: string;
  /** Overwrite existing file (-f, --overwrite). Default: false */
  overwrite: boolean;
  /** Show help message (-h, --help). */
  help: boolean;
  /** Show version number (-v, --version). */
  version: boolean;
}
```

| Property | Description |
| --- | --- |
| `output` | Output path for TAG_TAXONOMY.md (-o, --output). Default: docs/architecture/TAG_TAXONOMY.md |
| `baseDir` | Base directory for path resolution (-b, --base-dir). Default: cwd |
| `overwrite` | Overwrite existing file (-f, --overwrite). Default: false |
| `help` | Show help message (-h, --help). |
| `version` | Show version number (-v, --version). |

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
