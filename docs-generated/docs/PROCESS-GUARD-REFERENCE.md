# ProcessGuardReference

**Purpose:** Full documentation generated from decision document
**Detail Level:** detailed

---

**Problem:**
  Process Guard validates delivery workflow changes at commit time.
  Developers need quick access to validation rules, error messages, fixes, and CLI usage.
  Maintaining this documentation manually leads to drift from actual implementation.

  **Solution:**
  Auto-generate the Process Guard reference documentation from annotated source code.
  The source code defines the validation rules, error messages, and CLI options.
  Documentation becomes a projection of the implementation, always in sync.

  **Target Documents:**

| Output | Purpose | Detail Level |
| docs-generated/docs/PROCESSGUARDREFERENCE.md | Detailed human reference | detailed |
| docs-generated/_claude-md/validation/processguardreference.md | Compact AI context | summary |

  **Source Mapping:**

| Section | Source File | Extraction Method |
| --- | --- | --- |
| Protection Levels | THIS DECISION (Rule: Protection Levels) | Rule block table |
| Valid Transitions | THIS DECISION (Rule: Valid Transitions) | Rule block table |
| FSM Diagram | THIS DECISION (Rule: Valid Transitions DocString) | Fenced code block (Mermaid) |
| Validation Rules | src/lint/process-guard/types.ts | @extract-shapes tag |
| Decider Function | src/lint/process-guard/decider.ts | @extract-shapes tag |
| CLI Config | src/cli/lint-process.ts | @extract-shapes tag |
| FSM Transitions | src/validation/fsm/transitions.ts | @extract-shapes tag |
| CLI Examples | THIS DECISION (Rule: CLI Usage DocString) | Fenced code block |
| API Example | THIS DECISION (Rule: Programmatic API DocString) | Fenced code block |

---

## Implementation Details

### Protection Levels

**Context:** Different FSM states have different protection levels.

    **Decision:** Protection levels are derived from status:

| Status | Level | Allowed | Blocked |
| --- | --- | --- | --- |
| roadmap | none | Full editing | - |
| deferred | none | Full editing | - |
| active | scope | Edit existing deliverables | Adding new deliverables |
| completed | hard | Nothing | Any change without unlock-reason |

### Validation Rules

```typescript
/**
 * Process guard rule identifiers.
 *
 * Note: `taxonomy-locked-tag` and `taxonomy-enum-in-use` were removed when
 * taxonomy moved from JSON to TypeScript. TypeScript changes require
 * recompilation, making runtime validation unnecessary.
 */
type ProcessGuardRule =
  | 'completed-protection'
  | 'scope-creep'
  | 'invalid-status-transition'
  | 'session-scope'
  | 'session-excluded'
  | 'deliverable-removed';
```

```typescript
/**
 * Input to the process guard decider.
 * Contains all information needed for validation.
 */
interface DeciderInput {
  readonly state: ProcessState;
  readonly changes: ChangeDetection;
  readonly options: DeciderOptions;
}
```

```typescript
/**
 * Result of process guard validation.
 */
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

```typescript
/**
 * A validation violation from the process guard linter.
 */
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

```typescript
/**
 * State for a single file derived from its @libar-docs-* annotations.
 */
interface FileState {
  /** Absolute file path */
  readonly path: string;
  /** Relative path from project root */
  readonly relativePath: string;
  /** Status from @libar-docs-status annotation */
  readonly status: ProcessStatusValue;
  /** Normalized status for display */
  readonly normalizedStatus: NormalizedStatus;
  /** Protection level from FSM (none/scope/hard) */
  readonly protection: ProtectionLevel;
  /** Deliverable names from Background table */
  readonly deliverables: readonly string[];
  /** Whether file has @libar-docs-unlock-reason */
  readonly hasUnlockReason: boolean;
  /** The unlock reason text if present */
  readonly unlockReason?: string;
}
```

### Decider Function

```typescript
/**
 * Validate changes against process rules.
 *
 * Pure function following the Decider pattern:
 * - Takes all inputs explicitly (no hidden state)
 * - Returns result without side effects
 * - Emits events for observability
 *
 * @param input - Complete input including state, changes, and options
 * @returns DeciderOutput with validation result and events
 *
 * @example
 * ```typescript
 * const output = validateChanges({
 *   state: processState,
 *   changes: changeDetection,
 *   options: { strict: false, ignoreSession: false },
 * });
 *
 * if (!output.result.valid) {
 *   console.log('Violations:', output.result.violations);
 * }
 * ```
 */
function validateChanges(input: DeciderInput): DeciderOutput;
```

### CLI Config

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

### FSM Transitions

```typescript
/**
 * Valid FSM transitions matrix
 *
 * Maps each state to the list of states it can transition to.
 *
 * | From      | Valid Targets              | Notes                        |
 * |-----------|----------------------------|------------------------------|
 * | roadmap   | active, deferred, roadmap  | Can start, park, or stay     |
 * | active    | completed, roadmap         | Can finish or regress        |
 * | completed | (none)                     | Terminal state               |
 * | deferred  | roadmap                    | Must go through roadmap      |
 */
const VALID_TRANSITIONS: Readonly<
  Record<ProcessStatusValue, readonly ProcessStatusValue[]>
>;
```

```typescript
/**
 * Check if a transition between two states is valid
 *
 * @param from - Current status
 * @param to - Target status
 * @returns true if the transition is allowed
 *
 * @example
 * ```typescript
 * isValidTransition("roadmap", "active"); // → true
 * isValidTransition("roadmap", "completed"); // → false (must go through active)
 * isValidTransition("completed", "active"); // → false (terminal state)
 * ```
 */
function isValidTransition(from: ProcessStatusValue, to: ProcessStatusValue): boolean;
```

```typescript
/**
 * Get all valid transitions from a given state
 *
 * @param status - Current status
 * @returns Array of valid target states (empty for terminal states)
 *
 * @example
 * ```typescript
 * getValidTransitionsFrom("roadmap"); // → ["active", "deferred", "roadmap"]
 * getValidTransitionsFrom("completed"); // → []
 * ```
 */
function getValidTransitionsFrom(status: ProcessStatusValue): readonly ProcessStatusValue[];
```

```typescript
/**
 * Get a human-readable description of why a transition is invalid
 *
 * @param from - Current status
 * @param to - Attempted target status
 * @param options - Optional message options with registry for prefix
 * @returns Error message describing the violation
 *
 * @example
 * ```typescript
 * getTransitionErrorMessage("roadmap", "completed");
 * // → "Cannot transition from 'roadmap' to 'completed'. Must go through 'active' first."
 *
 * getTransitionErrorMessage("completed", "active");
 * // → "Cannot transition from 'completed' (terminal state). Use unlock-reason tag to modify."
 * ```
 */
function getTransitionErrorMessage(
  from: ProcessStatusValue,
  to: ProcessStatusValue,
  options?: TransitionMessageOptions
): string;
```

## Protection Levels

**Context:** Different FSM states have different protection levels.

    **Decision:** Protection levels are derived from status:

| Status | Level | Allowed | Blocked |
| --- | --- | --- | --- |
| roadmap | none | Full editing | - |
| deferred | none | Full editing | - |
| active | scope | Edit existing deliverables | Adding new deliverables |
| completed | hard | Nothing | Any change without unlock-reason |

## Valid Transitions

**Context:** Status transitions must follow the FSM to maintain process integrity.

| From | To | Notes |
| --- | --- | --- |
| roadmap | active, deferred | Start work or postpone |
| active | completed, roadmap | Finish or regress if blocked |
| deferred | roadmap | Resume planning |
| completed | (none) | Terminal - use unlock to modify |

    **FSM Diagram:**

```mermaid
stateDiagram-v2
        [*] --> roadmap
        roadmap --> active : Start work
        roadmap --> deferred : Postpone
        active --> completed : Finish
        active --> roadmap : Regress (blocked)
        deferred --> roadmap : Resume
        completed --> [*]

        note right of completed : Terminal state
        note right of active : Scope-locked
```

## Escape Hatches

**Context:** Sometimes process rules need to be bypassed for legitimate reasons.

    **Decision:** These escape hatches are available:

| Situation | Solution | Example |
| --- | --- | --- |
| Fix bug in completed spec | Add unlock-reason tag | @libar-docs-unlock-reason:'Fix-typo' |
| Modify outside session scope | Use --ignore-session flag | lint-process --staged --ignore-session |
| CI treats warnings as errors | Use --strict flag | lint-process --all --strict |

## Validation Rules

Process Guard validates these rules:

| Rule | Severity | Description |
| --- | --- | --- |
| completed-protection | error | Cannot modify completed specs without unlock-reason |
| invalid-status-transition | error | Status transition must follow FSM |
| scope-creep | error | Cannot add deliverables to active specs |
| session-excluded | error | Cannot modify files excluded from session |
| session-scope | warning | File not in active session scope |
| deliverable-removed | warning | Deliverable was removed (informational) |

## CLI Usage

Process Guard is invoked via the lint-process CLI command.

| Flag | Description | Use Case |
| --- | --- | --- |
| --staged | Validate staged changes (default) | Pre-commit hooks |
| --all | Validate all changes vs main | CI/CD pipelines |
| --strict | Treat warnings as errors | CI enforcement |
| --ignore-session | Skip session scope rules | Emergency changes |
| --show-state | Show derived process state | Debugging |
| --format json | Machine-readable output | CI integration |

    **CLI Examples:**

```bash
lint-process --staged
    lint-process --all --strict
    lint-process --file specs/my-feature.feature
    lint-process --staged --show-state
    lint-process --staged --ignore-session
```

## Programmatic API

Process Guard can be used programmatically for custom integrations.

    **Usage Example:**

```typescript
import {
      deriveProcessState,
      detectStagedChanges,
      validateChanges,
      hasErrors,
      summarizeResult,
    } from '@libar-dev/delivery-process/lint';

    const state = (await deriveProcessState({ baseDir: '.' })).value;
    const changes = detectStagedChanges('.').value;
    const { result } = validateChanges({
      state,
      changes,
      options: { strict: false, ignoreSession: false },
    });

    if (hasErrors(result)) {
      console.log(summarizeResult(result));
      for (const v of result.violations) {
        console.log(`[${v.rule}] ${v.file}: ${v.message}`);
      }
      process.exit(1);
    }
```

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

## Architecture

Process Guard uses the Decider pattern for testable validation.

    **Data Flow Diagram:**

```mermaid
flowchart LR
        A[deriveProcessState] --> C[validateChanges]
        B[detectChanges] --> C
        C --> D[ValidationResult]

        subgraph Pure Functions
            C
        end

        subgraph I/O
            A
            B
        end
```

**Principle:** State is derived from file annotations - there is no separate state file to maintain.
