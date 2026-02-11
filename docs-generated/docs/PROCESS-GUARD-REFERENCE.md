# Process Guard Reference

**Purpose:** Reference document: Process Guard Reference
**Detail Level:** Full reference

---

## Context - Why Process Guard Exists

The delivery workflow defines states for specifications:
    - **roadmap:** Planning phase, fully editable
    - **active:** Implementation in progress, scope-locked
    - **completed:** Work finished, hard-locked
    - **deferred:** Parked work, fully editable

    Without enforcement, these states are advisory only. Process Guard
    makes them enforceable through pre-commit validation.

---

## Decision - How Process Guard Works

Process Guard implements 7 validation rules:

    The linter runs as a pre-commit hook via Husky.
    See `.husky/pre-commit` for the hook configuration.

    Pre-commit: `npx lint-process --staged`
    CI pipeline: `npx lint-process --all --strict`

---

## Consequences - Trade-offs of This Approach

**Benefits:**
    - Catches workflow errors before they enter git history
    - Prevents accidental scope creep during active development
    - Protects completed work from unintended modifications
    - Clear escape hatch via unlock-reason annotation

    **Costs:**
    - Requires understanding of FSM states and transitions
    - Initial friction when modifying completed specs
    - Pre-commit hook adds a few seconds to commit time

---

## FSM Diagram

The FSM enforces valid state transitions. Protection levels and transitions
    are defined in TypeScript (extracted via @extract-shapes).

---

## Escape Hatches

**Context:** Sometimes process rules need to be bypassed for legitimate reasons.

    **Decision:** These escape hatches are available:

| Situation | Solution | Example |
| --- | --- | --- |
| Fix bug in completed spec | Add unlock-reason tag | @libar-docs-unlock-reason:'Fix-typo' |
| Modify outside session scope | Use --ignore-session flag | lint-process --staged --ignore-session |
| CI treats warnings as errors | Use --strict flag | lint-process --all --strict |

---

## Rule Descriptions

Process Guard validates 6 rules (types extracted from TypeScript):

| Rule | Severity | Human Description |
| --- | --- | --- |
| completed-protection | error | Cannot modify completed specs without unlock-reason |
| invalid-status-transition | error | Status transition must follow FSM |
| scope-creep | error | Cannot add deliverables to active specs |
| session-excluded | error | Cannot modify files excluded from session |
| session-scope | warning | File not in active session scope |
| deliverable-removed | warning | Deliverable was removed (informational) |

---

## Error Messages and Fixes

**Context:** Each validation rule produces a specific error message with actionable fix guidance.

    **Error Message Reference:**

    **Common Invalid Transitions:**

    **Fix Patterns:**

    1. **completed-protection**: Add `unlock-reason` tag with hyphenated reason
    2. **invalid-status-transition**: Follow FSM path (roadmap to active to completed)
    3. **scope-creep**: Remove new deliverable OR revert status to `roadmap` temporarily
    4. **session-scope**: Add file to session scope OR use `--ignore-session` flag
    5. **session-excluded**: Remove from exclusion list OR use `--ignore-session` flag

    For detailed fix examples with code snippets, see [PROCESS-GUARD.md](/docs/PROCESS-GUARD.md).

| Rule | Severity | Example Error | Fix |
| --- | --- | --- | --- |
| completed-protection | error | Cannot modify completed spec without unlock reason | Add unlock-reason tag |
| invalid-status-transition | error | Invalid status transition: roadmap to completed | Follow FSM path |
| scope-creep | error | Cannot add deliverables to active spec | Remove deliverable or revert to roadmap |
| session-scope | warning | File not in active session scope | Add to scope or use --ignore-session |
| session-excluded | error | File is explicitly excluded from session | Remove from exclusion or use --ignore-session |
| deliverable-removed | warning | Deliverable removed: "Unit tests" | Informational only |

| Attempted | Why Invalid | Valid Path |
| --- | --- | --- |
| roadmap to completed | Must go through active | roadmap to active to completed |
| deferred to active | Must return to roadmap first | deferred to roadmap to active |
| deferred to completed | Cannot skip two states | deferred to roadmap to active to completed |
| completed to any | Terminal state | Use unlock-reason tag to modify |

---

## CLI Usage

Process Guard is invoked via the lint-process CLI command.
    Configuration interface (`ProcessGuardCLIConfig`) is extracted from `src/cli/lint-process.ts`.

    **CLI Commands:**

    **CLI Options:**

    **Integration:** See `.husky/pre-commit` for pre-commit hook setup and `package.json` scripts section for npm script configuration.

| Command | Purpose |
| --- | --- |
| `lint-process --staged` | Pre-commit validation (default mode) |
| `lint-process --all --strict` | CI pipeline with strict mode |
| `lint-process --file specs/my-feature.feature` | Validate specific file |
| `lint-process --staged --show-state` | Debug: show derived process state |
| `lint-process --staged --ignore-session` | Override session scope checking |

| Option | Description |
| --- | --- |
| `--staged` | Validate staged files only (pre-commit) |
| `--all` | Validate all tracked files (CI) |
| `--strict` | Treat warnings as errors (exit 1) |
| `--ignore-session` | Skip session scope validation |
| `--show-state` | Debug: show derived process state |
| `--format json` | Machine-readable JSON output |

---

## Programmatic API

Process Guard can be used programmatically for custom integrations.

    **Usage Example:**

    

    **API Functions:**

| Category | Function | Description |
| --- | --- | --- |
| State | deriveProcessState(cfg) | Build state from file annotations |
| Changes | detectStagedChanges(dir) | Parse staged git diff |
| Changes | detectBranchChanges(dir) | Parse all changes vs main |
| Changes | detectFileChanges(dir, f) | Parse specific files |
| Validate | validateChanges(input) | Run all validation rules |
| Results | hasErrors(result) | Check for blocking errors |
| Results | hasWarnings(result) | Check for warnings |
| Results | summarizeResult(result) | Human-readable summary |

---

## Architecture

Process Guard uses the Decider pattern for testable validation.

    **Data Flow Diagram:**

    

    **Principle:** State is derived from file annotations - there is no separate state file to maintain.

---

## Related Documentation

**Context:** Related documentation for deeper understanding.

| Document | Relationship | Focus |
| --- | --- | --- |
| VALIDATION-REFERENCE.md | Sibling | DoD validation, anti-pattern detection |
| SESSION-GUIDES-REFERENCE.md | Prerequisite | Planning/Implementation workflows that Process Guard enforces |
| CONFIGURATION-REFERENCE.md | Reference | Presets and tag configuration |
| METHODOLOGY-REFERENCE.md | Background | Code-first documentation philosophy |

---

## API Types

### AntiPatternId (type)

/**
 * Anti-pattern rule identifiers
 *
 * Each ID corresponds to a specific violation of the dual-source
 * documentation architecture or process hygiene.
 */

```typescript
type AntiPatternId =
  | 'tag-duplication' // Dependencies in features (should be code-only)
  | 'process-in-code' // Process metadata in code (should be features-only)
  | 'magic-comments' // Generator hints in features
  | 'scenario-bloat' // Too many scenarios per feature
  | 'mega-feature';
```

### AntiPatternViolation (interface)

/**
 * Anti-pattern detection result
 *
 * Reports a specific anti-pattern violation with context
 * for remediation.
 */

```typescript
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
| id | Anti-pattern identifier |
| message | Human-readable description |
| file | File where violation was found |
| line | Line number (if applicable) |
| severity | Severity (error = architectural violation, warning = hygiene issue) |
| fix | Fix guidance |

### AntiPatternThresholds (type)

```typescript
type AntiPatternThresholds = z.infer<typeof AntiPatternThresholdsSchema>;
```

### AntiPatternThresholdsSchema (const)

/**
 * Zod schema for anti-pattern thresholds
 *
 * Configurable limits for detecting anti-patterns.
 */

```typescript
AntiPatternThresholdsSchema = z.object({
  /** Maximum scenarios per feature file before warning */
  scenarioBloatThreshold: z.number().int().positive().default(20),
  /** Maximum lines per feature file before warning */
  megaFeatureLineThreshold: z.number().int().positive().default(500),
  /** Maximum magic comments before warning */
  magicCommentThreshold: z.number().int().positive().default(5),
})
```

### DEFAULT_THRESHOLDS (const)

/**
 * Default thresholds for anti-pattern detection
 */

```typescript
const DEFAULT_THRESHOLDS: AntiPatternThresholds;
```

### DoDValidationResult (interface)

/**
 * DoD validation result for a single phase/pattern
 *
 * Reports whether a completed phase meets Definition of Done criteria:
 * 1. All deliverables must have "complete" status
 * 2. At least one @acceptance-criteria scenario must exist
 */

```typescript
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
| patternName | Pattern name being validated |
| phase | Phase number being validated |
| isDoDMet | True if all DoD criteria are met |
| deliverables | All deliverables from Background table |
| incompleteDeliverables | Deliverables that are not yet complete |
| missingAcceptanceCriteria | True if no @acceptance-criteria scenarios found |
| messages | Human-readable validation messages |

### DoDValidationSummary (interface)

/**
 * Aggregate DoD validation summary
 *
 * Summarizes validation across multiple phases for CLI output.
 */

```typescript
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
| results | Per-phase validation results |
| totalPhases | Total phases validated |
| passedPhases | Phases that passed DoD |
| failedPhases | Phases that failed DoD |

### getPhaseStatusEmoji (function)

/**
 * Get status emoji for phase-level aggregates.
 *
 * @param allComplete - Whether all patterns in the phase are complete
 * @param anyActive - Whether any patterns in the phase are active/in-progress
 * @returns Status emoji: ✅ if all complete, 🚧 if any active, 📋 otherwise
 */

```typescript
function getPhaseStatusEmoji(allComplete: boolean, anyActive: boolean): string;
```

### WithTagRegistry (interface)

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

```typescript
interface WithTagRegistry {
  /** Tag registry for prefix-aware behavior (defaults to @libar-docs- if not provided) */
  readonly registry?: TagRegistry;
}
```

| Property | Description |
| --- | --- |
| registry | Tag registry for prefix-aware behavior (defaults to @libar-docs- if not provided) |

### isDeliverableComplete (function)

/**
 * Check if a deliverable status indicates completion
 *
 * Uses canonical deliverable status taxonomy. Status must be 'complete'.
 *
 * @param deliverable - The deliverable to check
 * @returns True if the deliverable is complete
 */

```typescript
function isDeliverableComplete(deliverable: Deliverable): boolean;
```

### hasAcceptanceCriteria (function)

/**
 * Check if a feature has @acceptance-criteria scenarios
 *
 * Scans scenarios for the @acceptance-criteria tag, which indicates
 * BDD-driven acceptance tests.
 *
 * @param feature - The scanned feature file to check
 * @returns True if at least one @acceptance-criteria scenario exists
 */

```typescript
function hasAcceptanceCriteria(feature: ScannedGherkinFile): boolean;
```

### extractAcceptanceCriteriaScenarios (function)

/**
 * Extract acceptance criteria scenario names from a feature
 *
 * @param feature - The scanned feature file
 * @returns Array of scenario names with @acceptance-criteria tag
 */

```typescript
function extractAcceptanceCriteriaScenarios(feature: ScannedGherkinFile): readonly string[];
```

### validateDoDForPhase (function)

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

```typescript
function validateDoDForPhase(
  patternName: string,
  phase: number,
  feature: ScannedGherkinFile
): DoDValidationResult;
```

### validateDoD (function)

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

```typescript
function validateDoD(
  features: readonly ScannedGherkinFile[],
  phaseFilter: readonly number[] = []
): DoDValidationSummary;
```

### formatDoDSummary (function)

/**
 * Format DoD validation summary for console output
 *
 * @param summary - DoD validation summary to format
 * @returns Multi-line string for pretty printing
 */

```typescript
function formatDoDSummary(summary: DoDValidationSummary): string;
```

### AntiPatternDetectionOptions (interface)

/**
 * Configuration options for anti-pattern detection
 */

```typescript
interface AntiPatternDetectionOptions extends WithTagRegistry {
  /** Thresholds for warning triggers */
  readonly thresholds?: Partial<AntiPatternThresholds>;
}
```

| Property | Description |
| --- | --- |
| thresholds | Thresholds for warning triggers |

### detectAntiPatterns (function)

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

```typescript
function detectAntiPatterns(
  scannedFiles: readonly ScannedFile[],
  features: readonly ScannedGherkinFile[],
  options: AntiPatternDetectionOptions =;
```

### detectProcessInCode (function)

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

```typescript
function detectProcessInCode(
  scannedFiles: readonly ScannedFile[],
  registry?: TagRegistry
): AntiPatternViolation[];
```

### detectMagicComments (function)

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

```typescript
function detectMagicComments(
  features: readonly ScannedGherkinFile[],
  threshold: number = DEFAULT_THRESHOLDS.magicCommentThreshold
): AntiPatternViolation[];
```

### detectScenarioBloat (function)

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

```typescript
function detectScenarioBloat(
  features: readonly ScannedGherkinFile[],
  threshold: number = DEFAULT_THRESHOLDS.scenarioBloatThreshold
): AntiPatternViolation[];
```

### detectMegaFeature (function)

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

```typescript
function detectMegaFeature(
  features: readonly ScannedGherkinFile[],
  threshold: number = DEFAULT_THRESHOLDS.megaFeatureLineThreshold
): AntiPatternViolation[];
```

### formatAntiPatternReport (function)

/**
 * Format anti-pattern violations for console output
 *
 * @param violations - Array of violations to format
 * @returns Multi-line string for pretty printing
 */

```typescript
function formatAntiPatternReport(violations: AntiPatternViolation[]): string;
```

### toValidationIssues (function)

/**
 * Convert anti-pattern violations to ValidationIssue format
 *
 * For integration with the existing validate-patterns CLI.
 */

```typescript
function toValidationIssues(violations: readonly AntiPatternViolation[]): Array<;
```

### LintRule (interface)

/**
 * A lint rule that checks a parsed directive
 */

```typescript
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
| id | Unique rule ID |
| severity | Default severity level |
| description | Human-readable rule description |
| check | Check function that returns violation(s) or null if rule passes |

### LintContext (interface)

/**
 * Context for lint rules that need access to the full pattern registry.
 * Used for "strict mode" validation where relationships are checked
 * against known patterns.
 */

```typescript
interface LintContext {
  /** Set of known pattern names for relationship validation */
  readonly knownPatterns: ReadonlySet<string>;
  /** Tag registry for prefix-aware error messages (optional) */
  readonly registry?: TagRegistry;
}
```

| Property | Description |
| --- | --- |
| knownPatterns | Set of known pattern names for relationship validation |
| registry | Tag registry for prefix-aware error messages (optional) |

### defaultRules (const)

/**
 * All default lint rules
 *
 * Order matters for output - errors first, then warnings, then info.
 */

```typescript
const defaultRules: readonly LintRule[];
```

### severityOrder (const)

/**
 * Severity ordering for sorting and filtering
 * Exported for use by lint engine to avoid duplication
 */

```typescript
const severityOrder: Record<LintSeverity, number>;
```

### filterRulesBySeverity (function)

/**
 * Get rules filtered by minimum severity
 *
 * @param rules - Rules to filter
 * @param minSeverity - Minimum severity to include
 * @returns Filtered rules
 */

```typescript
function filterRulesBySeverity(
  rules: readonly LintRule[],
  minSeverity: LintSeverity
): LintRule[];
```

### missingPatternName (const)

/**
 * Rule: missing-pattern-name
 *
 * Patterns must have an explicit name via the pattern tag.
 * Without a name, the pattern can't be referenced in relationships
 * or indexed properly.
 */

```typescript
const missingPatternName: LintRule;
```

### missingStatus (const)

/**
 * Rule: missing-status
 *
 * Patterns should have an explicit status (completed, active, roadmap).
 * This helps readers understand if the pattern is ready for use.
 */

```typescript
const missingStatus: LintRule;
```

### invalidStatus (const)

/**
 * Rule: invalid-status
 *
 * Status values must be valid PDR-005 FSM states or recognized legacy aliases.
 *
 * Valid FSM values: roadmap, active, completed, deferred
 * Accepted legacy aliases: implemented → completed, partial → active, in-progress → active, planned → planned
 */

```typescript
const invalidStatus: LintRule;
```

### missingWhenToUse (const)

/**
 * Rule: missing-when-to-use
 *
 * Patterns should have a "When to Use" section for LLM-friendly guidance.
 * This helps developers understand when the pattern applies.
 */

```typescript
const missingWhenToUse: LintRule;
```

### tautologicalDescription (const)

/**
 * Rule: tautological-description
 *
 * The description should not simply repeat the pattern name.
 * A tautological description provides no useful information.
 */

```typescript
const tautologicalDescription: LintRule;
```

### missingRelationships (const)

/**
 * Rule: missing-relationships
 *
 * Patterns should declare their relationships (uses/usedBy) for
 * dependency tracking. This is informational only.
 */

```typescript
const missingRelationships: LintRule;
```

### patternConflictInImplements (const)

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

```typescript
const patternConflictInImplements: LintRule;
```

### missingRelationshipTarget (const)

/**
 * Rule: missing-relationship-target
 *
 * Validates that relationship targets (uses, implements) reference
 * patterns that actually exist. Only triggers when a LintContext with
 * knownPatterns is provided (strict mode).
 *
 * This is a context-aware rule that requires access to the pattern registry.
 */

```typescript
const missingRelationshipTarget: LintRule;
```

---
