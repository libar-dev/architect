/**
 * @architect
 * @architect-validation
 * @architect-pattern FSMValidator
 * @architect-status active
 * @architect-implements PhaseStateMachineValidation
 * @architect-uses FSMTransitions, FSMStates
 * @architect-depends-on:PDR005MvpWorkflow
 * @architect-arch-role decider
 * @architect-arch-context validation
 * @architect-arch-layer application
 *
 * ## FSM Validator - Pure Validation Functions
 *
 * Pure validation functions following the Decider pattern:
 * - No I/O, no side effects
 * - Return structured results, never throw
 * - Composable and testable
 *
 * ### When to Use
 *
 * - Use `validateStatus()` to validate status values before processing
 * - Use `validateTransition()` to check proposed status changes
 * - Use `validateCompletionMetadata()` to enforce completed state requirements
 */

import { PROCESS_STATUS_VALUES, type ProcessStatusValue } from '../../taxonomy/index.js';
import type { TagRegistry } from '../../validation-schemas/tag-registry.js';
import {
  VALID_TRANSITIONS,
  getValidTransitionsFrom,
  getTransitionErrorMessage,
} from './transitions.js';
import { isTerminalState, getProtectionLevel, type ProtectionLevel } from './states.js';
import { DEFAULT_TAG_PREFIX } from '../../config/defaults.js';

/**
 * Result of validating a status value
 */
export interface StatusValidationResult {
  /** Whether the status is valid */
  valid: boolean;
  /** The status that was validated */
  status: string;
  /** Error message if invalid */
  error?: string;
  /** Warnings (valid but with caveats) */
  warnings?: string[];
}

/**
 * Result of validating a status transition
 */
export interface TransitionValidationResult {
  /** Whether the transition is valid */
  valid: boolean;
  /** The source status */
  from: ProcessStatusValue;
  /** The target status */
  to: ProcessStatusValue;
  /** Error message if invalid */
  error?: string;
  /** Valid alternatives if transition is invalid */
  validAlternatives?: readonly ProcessStatusValue[];
}

/**
 * Result of validating completion metadata
 */
export interface CompletionMetadataValidationResult {
  /** Whether the metadata is valid/complete */
  valid: boolean;
  /** Warnings for missing optional metadata */
  warnings: string[];
}

/**
 * Pattern metadata for completion validation
 */
export interface PatternMetadata {
  status: string;
  completed?: string;
  effortActual?: string;
  effortPlanned?: string;
}

/**
 * Check if a string is a valid ProcessStatusValue
 */
function isValidStatusValue(status: string): status is ProcessStatusValue {
  return (PROCESS_STATUS_VALUES as readonly string[]).includes(status);
}

/**
 * Options for FSM validation functions
 */
export interface FSMValidationOptions {
  /** Tag registry for prefix-aware error messages (optional) */
  readonly registry?: TagRegistry;
}

/**
 * Validate a status value against PDR-005 FSM
 *
 * @param status - Status value to validate
 * @param options - Optional validation options with registry
 * @returns Validation result with error/warnings
 *
 * @example
 * ```typescript
 * validateStatus("roadmap"); // → { valid: true, status: "roadmap" }
 * validateStatus("done"); // → { valid: false, status: "done", error: "Invalid status..." }
 * ```
 */
export function validateStatus(
  status: string,
  options?: FSMValidationOptions
): StatusValidationResult {
  const tagPrefix = options?.registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;

  if (!isValidStatusValue(status)) {
    return {
      valid: false,
      status,
      error: `Invalid status '${status}'. Valid values: ${PROCESS_STATUS_VALUES.join(', ')}.`,
    };
  }

  const warnings: string[] = [];

  // Add contextual warnings for terminal state
  if (isTerminalState(status)) {
    warnings.push(
      `Status 'completed' is a terminal state. Use ${tagPrefix}unlock-reason to modify.`
    );
  }

  return {
    valid: true,
    status,
    ...(warnings.length > 0 && { warnings }),
  };
}

/**
 * Validate a status transition against FSM rules
 *
 * @param from - Current status
 * @param to - Target status
 * @returns Validation result with alternatives if invalid
 *
 * @example
 * ```typescript
 * validateTransition("roadmap", "active");
 * // → { valid: true, from: "roadmap", to: "active" }
 *
 * validateTransition("roadmap", "completed");
 * // → { valid: false, from: "roadmap", to: "completed",
 * //     error: "Cannot transition...", validAlternatives: ["active", "deferred", "roadmap"] }
 * ```
 */
export function validateTransition(from: string, to: string): TransitionValidationResult {
  // First validate both status values
  if (!isValidStatusValue(from)) {
    return {
      valid: false,
      from: from as ProcessStatusValue, // Type assertion for interface compliance
      to: to as ProcessStatusValue,
      error: `Invalid source status '${from}'. Valid values: ${PROCESS_STATUS_VALUES.join(', ')}.`,
    };
  }

  if (!isValidStatusValue(to)) {
    return {
      valid: false,
      from,
      to: to as ProcessStatusValue,
      error: `Invalid target status '${to}'. Valid values: ${PROCESS_STATUS_VALUES.join(', ')}.`,
    };
  }

  // Check if transition is valid
  const validTargets = VALID_TRANSITIONS[from];
  if (validTargets.includes(to)) {
    return {
      valid: true,
      from,
      to,
    };
  }

  // Invalid transition - provide helpful error and alternatives
  return {
    valid: false,
    from,
    to,
    error: getTransitionErrorMessage(from, to),
    validAlternatives: getValidTransitionsFrom(from),
  };
}

/**
 * Validate completion metadata requirements
 *
 * When a pattern has status "completed", it should have:
 * - completed date tag (warning if missing)
 * - effort-actual tag (warning if effort-planned exists but actual doesn't)
 *
 * @param pattern - Pattern metadata to validate
 * @param options - Optional validation options with registry
 * @returns Validation result with warnings
 *
 * @example
 * ```typescript
 * validateCompletionMetadata({ status: "completed" });
 * // → { valid: true, warnings: ["Completed pattern missing completed date tag"] }
 *
 * validateCompletionMetadata({ status: "completed", completed: "2026-01-09" });
 * // → { valid: true, warnings: [] }
 * ```
 */
export function validateCompletionMetadata(
  pattern: PatternMetadata,
  options?: FSMValidationOptions
): CompletionMetadataValidationResult {
  const tagPrefix = options?.registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;
  const warnings: string[] = [];

  // Only check completion requirements for completed status
  if (pattern.status !== 'completed') {
    return { valid: true, warnings: [] };
  }

  // Check for completion date
  if (!pattern.completed) {
    warnings.push(`Completed pattern missing ${tagPrefix}completed date.`);
  }

  // Check for effort tracking consistency
  if (pattern.effortPlanned && !pattern.effortActual) {
    warnings.push(
      `Pattern has ${tagPrefix}effort but missing ${tagPrefix}effort-actual. ` +
        'Consider adding actual effort for tracking.'
    );
  }

  return {
    valid: true,
    warnings,
  };
}

/**
 * Full validation of a pattern's status and metadata
 *
 * Combines status validation with completion metadata checks.
 *
 * @param pattern - Pattern metadata to validate
 * @param options - Optional validation options with registry
 * @returns Combined validation result
 */
export function validatePatternStatus(
  pattern: PatternMetadata,
  options?: FSMValidationOptions
): {
  valid: boolean;
  statusResult: StatusValidationResult;
  completionResult: CompletionMetadataValidationResult;
  allWarnings: string[];
} {
  const statusResult = validateStatus(pattern.status, options);
  const completionResult = validateCompletionMetadata(pattern, options);

  const allWarnings = [...(statusResult.warnings ?? []), ...completionResult.warnings];

  return {
    valid: statusResult.valid && completionResult.valid,
    statusResult,
    completionResult,
    allWarnings,
  };
}

/**
 * Get a summary of FSM protection for a status
 *
 * @param status - Status to describe
 * @param options - Optional validation options with registry
 * @returns Human-readable protection description
 */
export function getProtectionSummary(
  status: ProcessStatusValue,
  options?: FSMValidationOptions
): {
  level: ProtectionLevel;
  description: string;
  canAddDeliverables: boolean;
  requiresUnlock: boolean;
} {
  const tagPrefix = options?.registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;
  const level = getProtectionLevel(status);

  const descriptions: Record<ProtectionLevel, string> = {
    none: 'Fully editable - no restrictions',
    scope: 'Scope-locked - cannot add new deliverables',
    hard: `Hard-locked - requires ${tagPrefix}unlock-reason to modify`,
  };

  return {
    level,
    description: descriptions[level],
    canAddDeliverables: level === 'none',
    requiresUnlock: level === 'hard',
  };
}
