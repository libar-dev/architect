# ValidationReference

**Purpose:** Full documentation generated from decision document
**Detail Level:** detailed

---

**Problem:**
  The project has three validation commands (lint-patterns, lint-process, validate-patterns)
  with different purposes and options. Developers need quick access to understand which
  command to run and what each validates. Maintaining this documentation manually leads
  to drift from actual implementation.

  **Solution:**
  Auto-generate the Validation reference documentation from annotated source code.
  The source code defines the validation rules, anti-pattern detectors, and CLI options.
  Documentation becomes a projection of the implementation, always in sync.

  **Target Documents:**

| Output | Purpose | Detail Level |
| docs-generated/docs/VALIDATION-REFERENCE.md | Detailed human reference | detailed |
| docs-generated/_claude-md/validation/validation-reference.md | Compact AI context | summary |

  **Source Mapping:**

| Section | Source File | Extraction Method |
| --- | --- | --- |
| Command Decision Tree | THIS DECISION (Rule: Command Decision Tree) | Rule block content |
| Command Summary | THIS DECISION (Rule: Command Summary) | Rule block table |
| lint-patterns Rules | src/lint/rules.ts | extract-shapes tag |
| Anti-Pattern Detection | src/validation/anti-patterns.ts | extract-shapes tag |
| DoD Validation | src/validation/dod-validator.ts | extract-shapes tag |
| DoD Types | src/validation/types.ts | extract-shapes tag |
| validate-patterns Flags | src/cli/validate-patterns.ts | extract-shapes tag |
| CI/CD Integration | THIS DECISION (Rule: CI/CD Integration) | Rule block content |
| Exit Codes | THIS DECISION (Rule: Exit Codes) | Rule block table |
| Programmatic API | THIS DECISION (Rule: Programmatic API) | Fenced code block |
| Related Documentation | THIS DECISION (Rule: Related Documentation) | Rule block table |

---

## Implementation Details

### Command Decision Tree

**Context:** Developers need to quickly determine which validation command to run.

    **Decision Tree:**

| Question | Answer | Command |
| --- | --- | --- |
| Need annotation quality check? | Yes | lint-patterns |
| Need FSM workflow validation? | Yes | lint-process |
| Need cross-source or DoD validation? | Yes | validate-patterns |
| Running pre-commit hook? | Default | lint-process --staged |

### Command Summary

**Context:** Three validation commands serve different purposes.

    **Commands:**

| Command | Purpose | When to Use |
| --- | --- | --- |
| lint-patterns | Annotation quality | Ensure patterns have required tags |
| lint-process | FSM workflow enforcement | Pre-commit hooks, CI pipelines |
| validate-patterns | Cross-source + DoD + anti-pattern | Release validation, comprehensive |

### lint-patterns Rules

```typescript
/**
 * A lint rule that checks a parsed directive
 */
interface LintRule {
  /** Unique rule ID */
  readonly id: string;
  /** Default severity level */
  readonly severity: LintSeverity;
  /** Human-readable rule description */
  readonly description: string;
  /**
   * Check function that returns violation(s) or null if rule passes
   *
   * @param directive - Parsed directive to check
   * @param file - Source file path
   * @param line - Line number in source
   * @param context - Optional context with pattern registry for relationship validation
   * @returns Violation(s) if rule fails, null if passes. Array for rules that can detect multiple issues.
   */
  check: (
    directive: DocDirective,
    file: string,
    line: number,
    context?: LintContext
  ) => LintViolation | LintViolation[] | null;
}
```

| Property | Description |
| --- | --- |
| `id` | Unique rule ID |
| `severity` | Default severity level |
| `description` | Human-readable rule description |
| `check` | Check function that returns violation(s) or null if rule passes |

```typescript
/**
 * Context for lint rules that need access to the full pattern registry.
 * Used for "strict mode" validation where relationships are checked
 * against known patterns.
 */
interface LintContext {
  /** Set of known pattern names for relationship validation */
  readonly knownPatterns: ReadonlySet<string>;
  /** Tag registry for prefix-aware error messages (optional) */
  readonly registry?: TagRegistry;
}
```

| Property | Description |
| --- | --- |
| `knownPatterns` | Set of known pattern names for relationship validation |
| `registry` | Tag registry for prefix-aware error messages (optional) |

```typescript
/**
 * All default lint rules
 *
 * Order matters for output - errors first, then warnings, then info.
 */
const defaultRules: readonly LintRule[];
```

```typescript
/**
 * Severity ordering for sorting and filtering
 * Exported for use by lint engine to avoid duplication
 */
const severityOrder: Record<LintSeverity, number>;
```

```typescript
/**
 * Get rules filtered by minimum severity
 *
 * @param rules - Rules to filter
 * @param minSeverity - Minimum severity to include
 * @returns Filtered rules
 */
function filterRulesBySeverity(
  rules: readonly LintRule[],
  minSeverity: LintSeverity
): LintRule[];
```

```typescript
/**
 * Rule: missing-pattern-name
 *
 * Patterns must have an explicit name via the pattern tag.
 * Without a name, the pattern can't be referenced in relationships
 * or indexed properly.
 */
const missingPatternName: LintRule;
```

```typescript
/**
 * Rule: missing-status
 *
 * Patterns should have an explicit status (completed, active, roadmap).
 * This helps readers understand if the pattern is ready for use.
 */
const missingStatus: LintRule;
```

```typescript
/**
 * Rule: invalid-status
 *
 * Status values must be valid PDR-005 FSM states or recognized legacy aliases.
 *
 * Valid FSM values: roadmap, active, completed, deferred
 * Accepted legacy aliases: implemented → completed, partial → active, in-progress → active, planned → planned
 */
const invalidStatus: LintRule;
```

```typescript
/**
 * Rule: missing-when-to-use
 *
 * Patterns should have a "When to Use" section for LLM-friendly guidance.
 * This helps developers understand when the pattern applies.
 */
const missingWhenToUse: LintRule;
```

```typescript
/**
 * Rule: tautological-description
 *
 * The description should not simply repeat the pattern name.
 * A tautological description provides no useful information.
 */
const tautologicalDescription: LintRule;
```

```typescript
/**
 * Rule: missing-relationships
 *
 * Patterns should declare their relationships (uses/usedBy) for
 * dependency tracking. This is informational only.
 */
const missingRelationships: LintRule;
```

```typescript
/**
 * Rule: pattern-conflict-in-implements
 *
 * Validates that a file doesn't create a circular reference by defining
 * a pattern that it also implements. Having both @libar-docs-pattern X
 * AND @libar-docs-implements X on the same file is a conflict.
 *
 * However, a file CAN have both tags when they reference DIFFERENT patterns:
 * - @libar-docs-pattern SubPattern (defines its own identity)
 * - @libar-docs-implements ParentSpec (links to parent spec)
 *
 * This supports the sub-pattern hierarchy where implementation files can be
 * named patterns that also implement a larger spec (e.g., MockPaymentActions
 * implementing DurableEventsIntegration).
 */
const patternConflictInImplements: LintRule;
```

```typescript
/**
 * Rule: missing-relationship-target
 *
 * Validates that relationship targets (uses, implements) reference
 * patterns that actually exist. Only triggers when a LintContext with
 * knownPatterns is provided (strict mode).
 *
 * This is a context-aware rule that requires access to the pattern registry.
 */
const missingRelationshipTarget: LintRule;
```

### Anti-Pattern Detection

```typescript
/**
 * Configuration options for anti-pattern detection
 */
interface AntiPatternDetectionOptions extends WithTagRegistry {
  /** Thresholds for warning triggers */
  readonly thresholds?: Partial<AntiPatternThresholds>;
}
```

| Property | Description |
| --- | --- |
| `thresholds` | Thresholds for warning triggers |

```typescript
/**
 * Detect all anti-patterns
 *
 * Runs all anti-pattern detectors and returns combined violations.
 *
 * @param scannedFiles - Array of scanned TypeScript files
 * @param features - Array of scanned feature files
 * @param options - Optional configuration (registry for prefix, thresholds)
 * @returns Array of all detected anti-pattern violations
 *
 * @example
 * ```typescript
 * // With default prefix (@libar-docs-)
 * const violations = detectAntiPatterns(tsFiles, featureFiles);
 *
 * // With custom prefix
 * const registry = createDefaultTagRegistry();
 * registry.tagPrefix = "@docs-";
 * const customViolations = detectAntiPatterns(tsFiles, featureFiles, { registry });
 *
 * for (const v of violations) {
 *   console.log(`[${v.severity.toUpperCase()}] ${v.id}: ${v.message}`);
 * }
 * ```
 */
function detectAntiPatterns(
  scannedFiles: readonly ScannedFile[],
  features: readonly ScannedGherkinFile[],
  options: AntiPatternDetectionOptions =;
```

```typescript
/**
 * Detect process metadata in code anti-pattern
 *
 * Finds process tracking annotations (e.g., @docs-quarter, @docs-team, etc.)
 * in TypeScript files. Process metadata belongs in feature files.
 *
 * @param scannedFiles - Array of scanned TypeScript files
 * @param registry - Optional tag registry for prefix-aware detection (defaults to @libar-docs-)
 * @returns Array of anti-pattern violations
 */
function detectProcessInCode(
  scannedFiles: readonly ScannedFile[],
  registry?: TagRegistry
): AntiPatternViolation[];
```

```typescript
/**
 * Detect magic comments anti-pattern
 *
 * Finds generator hints like "# GENERATOR:", "# PARSER:" in feature files.
 * These create tight coupling between features and generators.
 *
 * @param features - Array of scanned feature files
 * @param threshold - Maximum magic comments before warning (default: 5)
 * @returns Array of anti-pattern violations
 */
function detectMagicComments(
  features: readonly ScannedGherkinFile[],
  threshold: number = DEFAULT_THRESHOLDS.magicCommentThreshold
): AntiPatternViolation[];
```

```typescript
/**
 * Detect scenario bloat anti-pattern
 *
 * Finds feature files with too many scenarios, which indicates poor
 * organization and slows test suites.
 *
 * @param features - Array of scanned feature files
 * @param threshold - Maximum scenarios before warning (default: 20)
 * @returns Array of anti-pattern violations
 */
function detectScenarioBloat(
  features: readonly ScannedGherkinFile[],
  threshold: number = DEFAULT_THRESHOLDS.scenarioBloatThreshold
): AntiPatternViolation[];
```

```typescript
/**
 * Detect mega-feature anti-pattern
 *
 * Finds feature files that are too large, which makes them hard to
 * maintain and review.
 *
 * @param features - Array of scanned feature files
 * @param threshold - Maximum lines before warning (default: 500)
 * @returns Array of anti-pattern violations
 */
function detectMegaFeature(
  features: readonly ScannedGherkinFile[],
  threshold: number = DEFAULT_THRESHOLDS.megaFeatureLineThreshold
): AntiPatternViolation[];
```

```typescript
/**
 * Format anti-pattern violations for console output
 *
 * @param violations - Array of violations to format
 * @returns Multi-line string for pretty printing
 */
function formatAntiPatternReport(violations: AntiPatternViolation[]): string;
```

```typescript
/**
 * Convert anti-pattern violations to ValidationIssue format
 *
 * For integration with the existing validate-patterns CLI.
 */
function toValidationIssues(violations: readonly AntiPatternViolation[]): Array<;
```

### DoD Validation

```typescript
/**
 * Check if a deliverable status indicates completion
 *
 * Uses canonical deliverable status taxonomy. Status must be 'complete'.
 *
 * @param deliverable - The deliverable to check
 * @returns True if the deliverable is complete
 */
function isDeliverableComplete(deliverable: Deliverable): boolean;
```

```typescript
/**
 * Check if a feature has @acceptance-criteria scenarios
 *
 * Scans scenarios for the @acceptance-criteria tag, which indicates
 * BDD-driven acceptance tests.
 *
 * @param feature - The scanned feature file to check
 * @returns True if at least one @acceptance-criteria scenario exists
 */
function hasAcceptanceCriteria(feature: ScannedGherkinFile): boolean;
```

```typescript
/**
 * Extract acceptance criteria scenario names from a feature
 *
 * @param feature - The scanned feature file
 * @returns Array of scenario names with @acceptance-criteria tag
 */
function extractAcceptanceCriteriaScenarios(feature: ScannedGherkinFile): readonly string[];
```

```typescript
/**
 * Validate DoD for a single phase/pattern
 *
 * Checks:
 * 1. All deliverables have "complete" status
 * 2. At least one @acceptance-criteria scenario exists
 *
 * @param patternName - Name of the pattern being validated
 * @param phase - Phase number being validated
 * @param feature - The scanned feature file with deliverables and scenarios
 * @returns DoD validation result
 */
function validateDoDForPhase(
  patternName: string,
  phase: number,
  feature: ScannedGherkinFile
): DoDValidationResult;
```

```typescript
/**
 * Validate DoD across multiple phases
 *
 * Filters to completed phases and validates each against DoD criteria.
 * Optionally filter to specific phases using phaseFilter.
 *
 * @param features - Array of scanned feature files
 * @param phaseFilter - Optional array of phase numbers to validate (validates all if empty)
 * @returns Aggregate DoD validation summary
 *
 * @example
 * ```typescript
 * // Validate all completed phases
 * const summary = validateDoD(features);
 *
 * // Validate specific phase
 * const summary = validateDoD(features, [14]);
 * ```
 */
function validateDoD(
  features: readonly ScannedGherkinFile[],
  phaseFilter: readonly number[] = []
): DoDValidationSummary;
```

```typescript
/**
 * Format DoD validation summary for console output
 *
 * @param summary - DoD validation summary to format
 * @returns Multi-line string for pretty printing
 */
function formatDoDSummary(summary: DoDValidationSummary): string;
```

### DoD Types

```typescript
/**
 * Anti-pattern rule identifiers
 *
 * Each ID corresponds to a specific violation of the dual-source
 * documentation architecture or process hygiene.
 */
type AntiPatternId =
  | 'tag-duplication' // Dependencies in features (should be code-only)
  | 'process-in-code' // Process metadata in code (should be features-only)
  | 'magic-comments' // Generator hints in features
  | 'scenario-bloat' // Too many scenarios per feature
  | 'mega-feature';
```

```typescript
/**
 * Anti-pattern detection result
 *
 * Reports a specific anti-pattern violation with context
 * for remediation.
 */
interface AntiPatternViolation {
  /** Anti-pattern identifier */
  readonly id: AntiPatternId;
  /** Human-readable description */
  readonly message: string;
  /** File where violation was found */
  readonly file: string;
  /** Line number (if applicable) */
  readonly line?: number;
  /** Severity (error = architectural violation, warning = hygiene issue) */
  readonly severity: 'error' | 'warning';
  /** Fix guidance */
  readonly fix?: string;
}
```

| Property | Description |
| --- | --- |
| `id` | Anti-pattern identifier |
| `message` | Human-readable description |
| `file` | File where violation was found |
| `line` | Line number (if applicable) |
| `severity` | Severity (error = architectural violation, warning = hygiene issue) |
| `fix` | Fix guidance |

```typescript
type AntiPatternThresholds = z.infer<typeof AntiPatternThresholdsSchema>;
```

```typescript
/**
 * Zod schema for anti-pattern thresholds
 *
 * Configurable limits for detecting anti-patterns.
 */
AntiPatternThresholdsSchema = z.object({
  /** Maximum scenarios per feature file before warning */
  scenarioBloatThreshold: z.number().int().positive().default(20),
  /** Maximum lines per feature file before warning */
  megaFeatureLineThreshold: z.number().int().positive().default(500),
  /** Maximum magic comments before warning */
  magicCommentThreshold: z.number().int().positive().default(5),
})
```

```typescript
/**
 * Default thresholds for anti-pattern detection
 */
const DEFAULT_THRESHOLDS: AntiPatternThresholds;
```

```typescript
/**
 * DoD validation result for a single phase/pattern
 *
 * Reports whether a completed phase meets Definition of Done criteria:
 * 1. All deliverables must have "complete" status
 * 2. At least one @acceptance-criteria scenario must exist
 */
interface DoDValidationResult {
  /** Pattern name being validated */
  readonly patternName: string;
  /** Phase number being validated */
  readonly phase: number;
  /** True if all DoD criteria are met */
  readonly isDoDMet: boolean;
  /** All deliverables from Background table */
  readonly deliverables: readonly Deliverable[];
  /** Deliverables that are not yet complete */
  readonly incompleteDeliverables: readonly Deliverable[];
  /** True if no @acceptance-criteria scenarios found */
  readonly missingAcceptanceCriteria: boolean;
  /** Human-readable validation messages */
  readonly messages: readonly string[];
}
```

| Property | Description |
| --- | --- |
| `patternName` | Pattern name being validated |
| `phase` | Phase number being validated |
| `isDoDMet` | True if all DoD criteria are met |
| `deliverables` | All deliverables from Background table |
| `incompleteDeliverables` | Deliverables that are not yet complete |
| `missingAcceptanceCriteria` | True if no @acceptance-criteria scenarios found |
| `messages` | Human-readable validation messages |

```typescript
/**
 * Aggregate DoD validation summary
 *
 * Summarizes validation across multiple phases for CLI output.
 */
interface DoDValidationSummary {
  /** Per-phase validation results */
  readonly results: readonly DoDValidationResult[];
  /** Total phases validated */
  readonly totalPhases: number;
  /** Phases that passed DoD */
  readonly passedPhases: number;
  /** Phases that failed DoD */
  readonly failedPhases: number;
}
```

| Property | Description |
| --- | --- |
| `results` | Per-phase validation results |
| `totalPhases` | Total phases validated |
| `passedPhases` | Phases that passed DoD |
| `failedPhases` | Phases that failed DoD |

```typescript
/**
 * Get status emoji for phase-level aggregates.
 *
 * @param allComplete - Whether all patterns in the phase are complete
 * @param anyActive - Whether any patterns in the phase are active/in-progress
 * @returns Status emoji: ✅ if all complete, 🚧 if any active, 📋 otherwise
 */
function getPhaseStatusEmoji(allComplete: boolean, anyActive: boolean): string;
```

```typescript
/**
 * Base interface for options that accept a TagRegistry for prefix-aware behavior.
 *
 * Many validation functions need to be aware of the configured tag prefix
 * (e.g., "@libar-docs-" vs "@docs-"). This interface provides a consistent
 * way to pass that configuration.
 *
 * ### When to Use
 *
 * Extend this interface when creating options for functions that:
 * - Generate error messages referencing tag names
 * - Detect tags in source code
 * - Validate tag formats
 *
 * @example
 * ```typescript
 * export interface MyValidationOptions extends WithTagRegistry {
 *   readonly strict?: boolean;
 * }
 * ```
 */
interface WithTagRegistry {
  /** Tag registry for prefix-aware behavior (defaults to @libar-docs- if not provided) */
  readonly registry?: TagRegistry;
}
```

| Property | Description |
| --- | --- |
| `registry` | Tag registry for prefix-aware behavior (defaults to @libar-docs- if not provided) |

### validate-patterns Flags

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

### CI/CD Integration

**Context:** Validation commands integrate into CI/CD pipelines.

    **Recommended npm Scripts:**

| Script Name | Command | Purpose |
| --- | --- | --- |
| lint:patterns | lint-patterns -i 'src/**/*.ts' | Annotation quality |
| lint:process | lint-process --staged | Pre-commit validation |
| lint:process:ci | lint-process --all --strict | CI pipeline |
| validate:all | validate-patterns -i 'src/**/*.ts' -F 'specs/**/*.feature' --dod --anti-patterns | Full validation |

    **Pre-commit Hook Setup:**

    Add to `.husky/pre-commit`: `npx lint-process --staged`

    **GitHub Actions Integration:**

| Step Name | Command |
| --- | --- |
| Lint annotations | npx lint-patterns -i "src/**/*.ts" --strict |
| Validate patterns | npx validate-patterns -i "src/**/*.ts" -F "specs/**/*.feature" --dod --anti-patterns |

### Exit Codes

**Context:** All validation commands use consistent exit codes.

| Code | Meaning |
| --- | --- |
| 0 | No errors (warnings allowed unless --strict) |
| 1 | Errors found (or warnings with --strict) |

### Programmatic API

**Context:** All validation tools expose programmatic APIs for custom integrations.

    **API Functions:**

| Category | Function | Description |
| --- | --- | --- |
| Linting | lintFiles(files, rules) | Run lint rules on files |
| Linting | hasFailures(result) | Check for lint failures |
| Anti-Patterns | detectAntiPatterns(ts, features) | Run all anti-pattern detectors |
| Anti-Patterns | detectProcessInCode(files) | Find process tags in TypeScript |
| Anti-Patterns | detectScenarioBloat(features) | Find feature files with too many scenarios |
| Anti-Patterns | detectMegaFeature(features) | Find feature files that are too large |
| Anti-Patterns | formatAntiPatternReport(violations) | Format violations for console output |
| DoD | validateDoD(features) | Validate DoD for all completed phases |
| DoD | validateDoDForPhase(name, phase, feature) | Validate DoD for single phase |
| DoD | isDeliverableComplete(deliverable) | Check if deliverable is done |
| DoD | hasAcceptanceCriteria(feature) | Check for @acceptance-criteria scenarios |
| DoD | formatDoDSummary(summary) | Format DoD results for console output |

    **Import Paths:**

```typescript
// Pattern linting
    import { lintFiles, hasFailures } from '@libar-dev/delivery-process/lint';

    // Anti-patterns and DoD
    import { detectAntiPatterns, validateDoD } from '@libar-dev/delivery-process/validation';
```

**Anti-Pattern Detection Example:**

```typescript
import { detectAntiPatterns } from '@libar-dev/delivery-process/validation';

    const violations = detectAntiPatterns(tsFiles, features, {
      thresholds: { scenarioBloatThreshold: 15 },
    });
```

**DoD Validation Example:**

```typescript
import { validateDoD, formatDoDSummary } from '@libar-dev/delivery-process/validation';

    const summary = validateDoD(features);
    console.log(formatDoDSummary(summary));
```

### Related Documentation

**Context:** Related documentation for deeper understanding.

| Document | Relationship | Focus |
| --- | --- | --- |
| PROCESS-GUARD-REFERENCE.md | Sibling | FSM workflow enforcement, pre-commit hooks |
| CONFIGURATION-REFERENCE.md | Reference | Tag prefixes, presets |
| TAXONOMY-REFERENCE.md | Reference | Valid status values, tag formats |
| INSTRUCTIONS-REFERENCE.md | Reference | Complete annotation reference |
