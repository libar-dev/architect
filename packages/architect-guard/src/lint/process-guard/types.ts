/**
 * @architect
 * @architect-pattern ProcessGuardTypes
 * @architect-lint
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:process-guard
 * @architect-implements ProcessGuardLinter
 * @architect-uses:FSMValidator
 *
 * ## ProcessGuardTypes - Type Definitions for Process Guard Linter
 *
 * Defines types for the process guard linter including:
 * - Process state derived from file annotations
 * - Git diff change detection results
 * - Validation results (violations and warnings)
 * - Session scoping types
 *
 * ### When to Use
 *
 * - When importing types for process guard implementations
 * - When implementing custom validation rules or decider functions
 * - When working with process state or change detection results
 *
 * ### Design Principles
 *
 * - Types enable pure Decider pattern (no I/O in validation)
 * - State is derived, not stored
 * - Protection levels from PDR-005 FSM
 */

import type {
  AcceptedStatusValue,
  NormalizedStatus,
  ProcessStatusValue,
} from '@libar-dev/architect-core';
import type { ProtectionLevel } from '@libar-dev/architect-core';
import type { TagRegistry } from '@libar-dev/architect-core';

// =============================================================================
// Core Process State Types
// =============================================================================

/**
 * Complete process state derived from file annotations.
 * This is computed by scanning files, not stored separately.
 *
 * @architect-shape
 */
export interface ProcessState {
  /** Map of file paths to their derived state */
  readonly files: Map<string, FileState>;
  /** Active session if one exists */
  readonly activeSession?: SessionState;
  /** Timestamp when state was derived */
  readonly derivedAt: string;
}

/**
 * State for a single file derived from its `@architect-*` annotations.
 *
 * @architect-shape
 */
export interface FileState {
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

// =============================================================================
// Session Types
// =============================================================================

/**
 * Lifecycle status of a work session.
 *
 * @architect-shape
 */
export type SessionStatus = 'draft' | 'active' | 'closed';

/**
 * State for a work session that scopes modifications.
 *
 * @architect-shape
 */
export interface SessionState {
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

// =============================================================================
// Change Detection Types
// =============================================================================

/**
 * Result of detecting changes from a git diff.
 *
 * @architect-shape
 */
export interface ChangeDetection {
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

/**
 * Location of a detected status tag in the git diff.
 * Used for debugging false positives and enhancing error messages.
 *
 * @architect-shape
 */
export interface StatusTagLocation {
  /** Line number in the new file version */
  readonly lineNumber: number;
  /** Whether this tag was inside a docstring (""") */
  readonly insideDocstring: boolean;
  /** The raw line from git diff (for debugging) */
  readonly rawLine: string;
}

/**
 * A status transition detected in a file.
 *
 * @architect-shape
 */
export interface StatusTransition {
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

/**
 * Deliverable changes detected in a file's Background table.
 *
 * @architect-shape
 */
export interface DeliverableChange {
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

// =============================================================================
// Validation Result Types
// =============================================================================

/**
 * Severity level of a process guard violation.
 *
 * @architect-shape
 */
export type ViolationSeverity = 'error' | 'warning';

/**
 * A validation violation from the process guard linter.
 *
 * @architect-shape
 */
export interface ProcessViolation {
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

/**
 * Result of process guard validation.
 *
 * @architect-shape
 */
export interface ValidationResult {
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

// =============================================================================
// Rule Types
// =============================================================================

/**
 * Process guard rule identifiers.
 *
 * Note: `taxonomy-locked-tag` and `taxonomy-enum-in-use` were removed when
 * taxonomy moved from JSON to TypeScript. TypeScript changes require
 * recompilation, making runtime validation unnecessary.
 *
 * @architect-shape
 */
export type ProcessGuardRule =
  | 'completed-protection'
  | 'scope-creep'
  | 'invalid-status-transition'
  | 'session-scope'
  | 'session-excluded'
  | 'deliverable-removed';

/**
 * A process guard validation rule.
 *
 * @architect-shape
 */
export interface ProcessGuardRuleDefinition {
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

// =============================================================================
// CLI Types
// =============================================================================

/**
 * CLI validation mode selecting which files the guard inspects.
 *
 * @architect-shape
 */
export type ValidationMode = 'staged' | 'all' | 'files';

/**
 * CLI options for the lint:process command.
 *
 * @architect-shape
 */
export interface LintProcessOptions {
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

// =============================================================================
// Decider Input/Output Types
// =============================================================================

/**
 * Options for the process guard decider.
 *
 * @architect-shape
 */
export interface DeciderOptions {
  /** Treat warnings as errors */
  readonly strict: boolean;
  /** Ignore session scope rules */
  readonly ignoreSession: boolean;
  /** Tag registry for prefix-aware error messages (optional) */
  readonly registry?: TagRegistry;
}

/**
 * Input to the process guard decider.
 * Contains all information needed for validation.
 *
 * @architect-shape
 */
export interface DeciderInput {
  /** Process state derived from the scanned files. */
  readonly state: ProcessState;
  /** Changes detected from the git diff. */
  readonly changes: ChangeDetection;
  /** Decider configuration options. */
  readonly options: DeciderOptions;
}

/**
 * Output from the process guard decider.
 * Pure function result with no side effects.
 *
 * @architect-shape
 */
export interface DeciderOutput {
  /** The validation result. */
  readonly result: ValidationResult;
  /** Commands to emit (for logging/metrics) */
  readonly events: readonly DeciderEvent[];
}

/**
 * Events emitted by the decider for observability.
 *
 * @architect-shape
 */
export type DeciderEvent =
  | { type: 'validation_started'; fileCount: number }
  | { type: 'rule_checked'; rule: ProcessGuardRule; passed: boolean }
  | { type: 'validation_completed'; valid: boolean; violationCount: number };
