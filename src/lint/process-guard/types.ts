/**
 * @libar-docs
 * @libar-docs-lint
 * @libar-docs-pattern ProcessGuardTypes
 * @libar-docs-status active
 * @libar-docs-depends-on:FSMValidator
 *
 * ## ProcessGuardTypes - Type Definitions for Process Guard Linter
 *
 * Defines types for the process guard linter including:
 * - Process state derived from file annotations
 * - Git diff change detection results
 * - Validation results (violations and warnings)
 * - Session scoping types
 *
 * ### Design Principles
 *
 * - Types enable pure Decider pattern (no I/O in validation)
 * - State is derived, not stored
 * - Protection levels from PDR-005 FSM
 */

import type { ProcessStatusValue, NormalizedStatus } from "../../taxonomy/index.js";
import type { ProtectionLevel } from "../../validation/fsm/index.js";
import type { TagRegistry } from "../../validation-schemas/tag-registry.js";

// =============================================================================
// Core Process State Types
// =============================================================================

/**
 * Complete process state derived from file annotations.
 * This is computed by scanning files, not stored separately.
 */
export interface ProcessState {
  /** Map of file paths to their derived state */
  readonly files: Map<string, FileState>;
  /** Active session if one exists */
  readonly activeSession?: SessionState;
  /** Hash of tag-registry.json for change detection */
  readonly taxonomyHash: string;
  /** Timestamp when state was derived */
  readonly derivedAt: string;
}

/**
 * State for a single file derived from its @libar-docs-* annotations.
 */
export interface FileState {
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

// =============================================================================
// Session Types
// =============================================================================

/** Session status lifecycle */
export type SessionStatus = "draft" | "active" | "closed";

/**
 * State for a work session that scopes modifications.
 */
export interface SessionState {
  /** Session identifier from @libar-docs-session-id */
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
 * Result of detecting changes from git diff.
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
  /**
   * Whether taxonomy was modified.
   * @deprecated Always false. Taxonomy moved from JSON to TypeScript (src/taxonomy/).
   * TypeScript changes require recompilation, making runtime detection unnecessary.
   */
  readonly taxonomyModified: boolean;
}

/**
 * A status transition detected in a file.
 */
export interface StatusTransition {
  readonly from: ProcessStatusValue;
  readonly to: ProcessStatusValue;
}

/**
 * Deliverable changes detected in a file's Background table.
 */
export interface DeliverableChange {
  readonly added: readonly string[];
  readonly removed: readonly string[];
  readonly modified: readonly string[];
}

// =============================================================================
// Validation Result Types
// =============================================================================

/** Violation severity level */
export type ViolationSeverity = "error" | "warning";

/**
 * A validation violation from the process guard linter.
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
 */
export type ProcessGuardRule =
  | "completed-protection"
  | "scope-creep"
  | "invalid-status-transition"
  | "session-scope"
  | "session-excluded"
  | "deliverable-removed";

/**
 * A process guard validation rule.
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

/** CLI validation mode */
export type ValidationMode = "staged" | "all" | "files";

/**
 * CLI options for lint:process command.
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
 */
export interface DeciderInput {
  readonly state: ProcessState;
  readonly changes: ChangeDetection;
  readonly options: DeciderOptions;
}

/**
 * Output from the process guard decider.
 * Pure function result with no side effects.
 */
export interface DeciderOutput {
  readonly result: ValidationResult;
  /** Commands to emit (for logging/metrics) */
  readonly events: readonly DeciderEvent[];
}

/**
 * Events emitted by the decider for observability.
 */
export type DeciderEvent =
  | { type: "validation_started"; fileCount: number }
  | { type: "rule_checked"; rule: ProcessGuardRule; passed: boolean }
  | { type: "validation_completed"; valid: boolean; violationCount: number };
