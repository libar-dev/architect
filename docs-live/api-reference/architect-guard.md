# architect-guard API Reference

**Purpose:** Type and API surface for a single workspace package

---

## Overview

24 shapes across 2 patterns in architect-guard.

## AntiPatternValidationTypes

### AntiPatternId

Anti-pattern rule identifiers Each ID corresponds to a specific violation of the dual-source documentation architecture or process hygiene. Compatibility note: the historical \`tag-duplication\` identifier is intentionally not part of the split-package public contract because \`detectAntiPatterns()\` does not emit it.

```ts
type AntiPatternId =
  | 'process-in-code' // Process metadata in code (should be features-only)
  | 'removed-tag' // Removed tag still present in source (silent data loss)
  | 'gherkin-tag-space-form' // Identity tag uses space-form on a .feature file; Gherkin requires colon form (silent data loss)
  | 'duplicate-pattern-identity' // Same @architect-pattern identity declared in >1 feature file (ADR-001)
  | 'magic-comments' // Generator hints in features
  | 'scenario-bloat' // Too many scenarios per feature
  | 'mega-feature';
```

### AntiPatternThresholdsSchema

Zod schema for anti-pattern thresholds. Configurable limits for detecting anti-patterns.

```ts
AntiPatternThresholdsSchema = z.strictObject({
  /** Maximum scenarios per feature file before warning */
  scenarioBloatThreshold: z.number().int().positive().default(30),
  /** Maximum lines per feature file before warning */
  megaFeatureLineThreshold: z.number().int().positive().default(750),
  /** Maximum magic comments before warning */
  magicCommentThreshold: z.number().int().positive().default(5),
})
```

### AntiPatternViolation

Anti-pattern detection result. Reports a specific anti-pattern violation with context for remediation.

```ts
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

#### Properties

| Property | Description                                                         |
| -------- | ------------------------------------------------------------------- |
| id       | Anti-pattern identifier                                             |
| message  | Human-readable description                                          |
| file     | File where violation was found                                      |
| line     | Line number (if applicable)                                         |
| severity | Severity (error = architectural violation, warning = hygiene issue) |
| fix      | Fix guidance                                                        |

### DEFAULT_THRESHOLDS

Default thresholds applied when none are supplied to anti-pattern detection.

```ts
const DEFAULT_THRESHOLDS: AntiPatternThresholds;
```

### WithTagRegistry

Base interface for options that accept a TagRegistry for prefix-aware behavior. Many validation functions need to be aware of the configured tag prefix (e.g., "@architect-" vs "@acme-"). This interface provides a consistent way to pass that configuration. ### When to Use Extend this interface when creating options for functions that: - Generate error messages referencing tag names - Detect tags in source code - Validate tag formats

```ts
interface WithTagRegistry {
  /** Tag registry for prefix-aware behavior (defaults to @architect- if not provided) */
  readonly registry?: TagRegistry;
}
```

#### Properties

| Property | Description                                                                      |
| -------- | -------------------------------------------------------------------------------- |
| registry | Tag registry for prefix-aware behavior (defaults to @architect- if not provided) |

## ProcessGuardTypes

### ChangeDetection

Result of detecting changes from a git diff.

```ts
interface ChangeDetection {
  /** Files that were modified (relative paths) */
  readonly modifiedFiles: readonly string[];
  /** Files that were added */
  readonly addedFiles: readonly string[];
  /** Files that were deleted */
  readonly deletedFiles: readonly string[];
  /** Status transitions detected (file path -> transition) */
  readonly statusTransitions: ReadonlyMap<string, StatusTransition>;
  /** Deliverable changes detected (file path -> changes) */
  readonly deliverableChanges: ReadonlyMap<string, DeliverableChange>;
}
```

#### Properties

| Property           | Description                                              |
| ------------------ | -------------------------------------------------------- |
| modifiedFiles      | Files that were modified (relative paths)                |
| addedFiles         | Files that were added                                    |
| deletedFiles       | Files that were deleted                                  |
| statusTransitions  | Status transitions detected (file path -&gt; transition) |
| deliverableChanges | Deliverable changes detected (file path -&gt; changes)   |

### DeciderEvent

Events emitted by the decider for observability.

```ts
type DeciderEvent =
  | { type: 'validation_started'; fileCount: number }
  | { type: 'rule_checked'; rule: ProcessGuardRule; passed: boolean }
  | { type: 'validation_completed'; valid: boolean; violationCount: number };
```

### DeciderInput

Input to the process guard decider. Contains all information needed for validation.

```ts
interface DeciderInput {
  /** Process state derived from the scanned files. */
  readonly state: ProcessState;
  /** Changes detected from the git diff. */
  readonly changes: ChangeDetection;
  /** Decider configuration options. */
  readonly options: DeciderOptions;
}
```

#### Properties

| Property | Description                                   |
| -------- | --------------------------------------------- |
| state    | Process state derived from the scanned files. |
| changes  | Changes detected from the git diff.           |
| options  | Decider configuration options.                |

### DeciderOptions

Options for the process guard decider.

```ts
interface DeciderOptions {
  /** Treat warnings as errors */
  readonly strict: boolean;
  /** Ignore session scope rules */
  readonly ignoreSession: boolean;
  /** Tag registry for prefix-aware error messages (optional) */
  readonly registry?: TagRegistry;
}
```

#### Properties

| Property      | Description                                             |
| ------------- | ------------------------------------------------------- |
| strict        | Treat warnings as errors                                |
| ignoreSession | Ignore session scope rules                              |
| registry      | Tag registry for prefix-aware error messages (optional) |

### DeciderOutput

Output from the process guard decider. Pure function result with no side effects.

```ts
interface DeciderOutput {
  /** The validation result. */
  readonly result: ValidationResult;
  /** Commands to emit (for logging/metrics) */
  readonly events: readonly DeciderEvent[];
}
```

#### Properties

| Property | Description                            |
| -------- | -------------------------------------- |
| result   | The validation result.                 |
| events   | Commands to emit (for logging/metrics) |

### DeliverableChange

Deliverable changes detected in a file's Background table.

```ts
interface DeliverableChange {
  /** Deliverable names added in the change. */
  readonly added: readonly string[];
  /**
   * Names of added deliverables whose status column is `pending` (unbuilt
   * scope). A subset of `added`; the advisory scope-creep rule warns only on
   * these, since adding a deliverable that records real progress
   * (in-progress/complete/deferred/superseded/n/a) is silent (PDR-006 Rule 3).
   */
  readonly addedPending: readonly string[];
  /** Deliverable names removed in the change. */
  readonly removed: readonly string[];
  /** Deliverable names whose definition changed. */
  readonly modified: readonly string[];
}
```

#### Properties

| Property     | Description                                                                                                                                                                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| added        | Deliverable names added in the change.                                                                                                                                                                                                                                                     |
| addedPending | Names of added deliverables whose status column is \`pending\` (unbuilt scope). A subset of \`added\`; the advisory scope-creep rule warns only on these, since adding a deliverable that records real progress (in-progress/complete/deferred/superseded/n/a) is silent (PDR-006 Rule 3). |
| removed      | Deliverable names removed in the change.                                                                                                                                                                                                                                                   |
| modified     | Deliverable names whose definition changed.                                                                                                                                                                                                                                                |

### FileState

State for a single file derived from its \`@architect-\*\` annotations.

```ts
interface FileState {
  /** Absolute file path */
  readonly path: string;
  /** Relative path from project root */
  readonly relativePath: string;
  /** Status from @architect-status annotation */
  readonly status: AcceptedStatusValue;
  /** Normalized status for display */
  readonly normalizedStatus: NormalizedStatus;
  /** Protection level from FSM (none/scope/hard) */
  readonly protection: ProtectionLevel;
  /** Deliverable names from Background table */
  readonly deliverables: readonly string[];
  /** Whether file has @architect-unlock-reason */
  readonly hasUnlockReason: boolean;
  /** The unlock reason text if present */
  readonly unlockReason?: string;
}
```

#### Properties

| Property         | Description                                 |
| ---------------- | ------------------------------------------- |
| path             | Absolute file path                          |
| relativePath     | Relative path from project root             |
| status           | Status from @architect-status annotation    |
| normalizedStatus | Normalized status for display               |
| protection       | Protection level from FSM (none/scope/hard) |
| deliverables     | Deliverable names from Background table     |
| hasUnlockReason  | Whether file has @architect-unlock-reason   |
| unlockReason     | The unlock reason text if present           |

### LintProcessOptions

CLI options for the lint:process command.

```ts
interface LintProcessOptions {
  /** Validation mode */
  readonly mode: ValidationMode;
  /** Specific files to validate (when mode is 'files') */
  readonly files?: readonly string[];
  /** Treat warnings as errors */
  readonly strict: boolean;
  /** Ignore session scope rules */
  readonly ignoreSession: boolean;
  /** Show derived process state (debugging) */
  readonly showState: boolean;
  /** Base directory for relative paths */
  readonly baseDir: string;
}
```

#### Properties

| Property      | Description                                       |
| ------------- | ------------------------------------------------- |
| mode          | Validation mode                                   |
| files         | Specific files to validate (when mode is 'files') |
| strict        | Treat warnings as errors                          |
| ignoreSession | Ignore session scope rules                        |
| showState     | Show derived process state (debugging)            |
| baseDir       | Base directory for relative paths                 |

### ProcessGuardRule

Process guard rule identifiers. Note: \`taxonomy-locked-tag\` and \`taxonomy-enum-in-use\` were removed when taxonomy moved from JSON to TypeScript. TypeScript changes require recompilation, making runtime validation unnecessary.

```ts
type ProcessGuardRule =
  | 'completed-protection'
  | 'scope-creep'
  | 'invalid-status-transition'
  | 'session-scope'
  | 'session-excluded'
  | 'deliverable-removed';
```

### ProcessGuardRuleDefinition

A process guard validation rule.

```ts
interface ProcessGuardRuleDefinition {
  /** Unique rule ID */
  readonly id: ProcessGuardRule;
  /** Default severity level */
  readonly severity: ViolationSeverity;
  /** Human-readable rule description */
  readonly description: string;
  /**
   * Validate changes against this rule.
   *
   * @param state - Current process state
   * @param changes - Detected changes
   * @returns Array of violations (empty if rule passes)
   */
  validate: (state: ProcessState, changes: ChangeDetection) => readonly ProcessViolation[];
}
```

#### Properties

| Property    | Description                         |
| ----------- | ----------------------------------- |
| id          | Unique rule ID                      |
| severity    | Default severity level              |
| description | Human-readable rule description     |
| validate    | Validate changes against this rule. |

### ProcessState

Complete process state derived from file annotations. This is computed by scanning files, not stored separately.

```ts
interface ProcessState {
  /** Map of file paths to their derived state */
  readonly files: Map<string, FileState>;
  /** Active session if one exists */
  readonly activeSession?: SessionState;
  /** Timestamp when state was derived */
  readonly derivedAt: string;
}
```

#### Properties

| Property      | Description                              |
| ------------- | ---------------------------------------- |
| files         | Map of file paths to their derived state |
| activeSession | Active session if one exists             |
| derivedAt     | Timestamp when state was derived         |

### ProcessViolation

A validation violation from the process guard linter.

```ts
interface ProcessViolation {
  /** Unique rule ID that triggered the violation */
  readonly rule: ProcessGuardRule;
  /** Severity (error = blocking, warning = informational) */
  readonly severity: ViolationSeverity;
  /** Human-readable error message */
  readonly message: string;
  /** File that triggered the violation */
  readonly file: string;
  /** Suggested fix or action */
  readonly suggestion?: string;
}
```

#### Properties

| Property   | Description                                          |
| ---------- | ---------------------------------------------------- |
| rule       | Unique rule ID that triggered the violation          |
| severity   | Severity (error = blocking, warning = informational) |
| message    | Human-readable error message                         |
| file       | File that triggered the violation                    |
| suggestion | Suggested fix or action                              |

### SessionState

State for a work session that scopes modifications.

```ts
interface SessionState {
  /** Session identifier from @architect-session-id */
  readonly id: string;
  /** Session lifecycle status */
  readonly status: SessionStatus;
  /** Specs that can be modified in this session */
  readonly scopedSpecs: readonly string[];
  /** Specs explicitly excluded from modification */
  readonly excludedSpecs: readonly string[];
  /** Session file path */
  readonly sessionFile: string;
}
```

#### Properties

| Property      | Description                                   |
| ------------- | --------------------------------------------- |
| id            | Session identifier from @architect-session-id |
| status        | Session lifecycle status                      |
| scopedSpecs   | Specs that can be modified in this session    |
| excludedSpecs | Specs explicitly excluded from modification   |
| sessionFile   | Session file path                             |

### SessionStatus

Lifecycle status of a work session.

```ts
type SessionStatus = 'draft' | 'active' | 'closed';
```

### StatusTagLocation

Location of a detected status tag in the git diff. Used for debugging false positives and enhancing error messages.

```ts
interface StatusTagLocation {
  /** Line number in the new file version */
  readonly lineNumber: number;
  /** Whether this tag was inside a docstring (""") */
  readonly insideDocstring: boolean;
  /** The raw line from git diff (for debugging) */
  readonly rawLine: string;
}
```

#### Properties

| Property        | Description                                   |
| --------------- | --------------------------------------------- |
| lineNumber      | Line number in the new file version           |
| insideDocstring | Whether this tag was inside a docstring (""") |
| rawLine         | The raw line from git diff (for debugging)    |

### StatusTransition

A status transition detected in a file.

```ts
interface StatusTransition {
  readonly from: ProcessStatusValue;
  readonly to: ProcessStatusValue;
  /** True if this is a new file (no previous status, defaults from 'roadmap') */
  readonly isNewFile?: boolean;
  /** True if the diff contains unlock-reason tag (supports file splits) */
  readonly hasUnlockReason?: boolean;
  /** Location of the 'to' status tag */
  readonly toLocation?: StatusTagLocation;
  /** All status tags found in diff (for debugging false positives) */
  readonly allDetectedTags?: readonly StatusTagLocation[];
}
```

#### Properties

| Property        | Description                                                              |
| --------------- | ------------------------------------------------------------------------ |
| isNewFile       | True if this is a new file (no previous status, defaults from 'roadmap') |
| hasUnlockReason | True if the diff contains unlock-reason tag (supports file splits)       |
| toLocation      | Location of the 'to' status tag                                          |
| allDetectedTags | All status tags found in diff (for debugging false positives)            |

### ValidationMode

CLI validation mode selecting which files the guard inspects.

```ts
type ValidationMode = 'staged' | 'all' | 'files';
```

### ValidationResult

Result of process guard validation.

```ts
interface ValidationResult {
  /** Whether all checks passed (no errors) */
  readonly valid: boolean;
  /** Blocking violations (must be fixed) */
  readonly violations: readonly ProcessViolation[];
  /** Non-blocking warnings */
  readonly warnings: readonly ProcessViolation[];
  /** Process state at time of validation */
  readonly processState: ProcessState;
  /** Changes that were validated */
  readonly changes: ChangeDetection;
}
```

#### Properties

| Property     | Description                           |
| ------------ | ------------------------------------- |
| valid        | Whether all checks passed (no errors) |
| violations   | Blocking violations (must be fixed)   |
| warnings     | Non-blocking warnings                 |
| processState | Process state at time of validation   |
| changes      | Changes that were validated           |

### ViolationSeverity

Severity level of a process guard violation.

```ts
type ViolationSeverity = 'error' | 'warning';
```

---

[← Back to API Reference](../API-REFERENCE.md)
