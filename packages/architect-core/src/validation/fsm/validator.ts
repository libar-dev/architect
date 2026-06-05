/**
 * @architect
 * @architect-validation
 * @architect-pattern FSMValidator
 * @architect-status active
 * @architect-uses FSMTransitions, FSMStates
 * @architect-role:decider
 * @architect-bounded-context:validation
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

export interface StatusValidationResult {
  valid: boolean;
  status: string;
  error?: string;
  warnings?: string[];
}

export type TransitionValidationResult =
  | {
      valid: true;
      from: ProcessStatusValue;
      to: ProcessStatusValue;
    }
  | {
      valid: false;
      from: string;
      to: string;
      error: string;
      validAlternatives?: readonly ProcessStatusValue[];
    };

export interface PatternMetadata {
  status: string;
}

export function isValidStatusValue(status: string): status is ProcessStatusValue {
  return (PROCESS_STATUS_VALUES as readonly string[]).includes(status);
}

export interface FSMValidationOptions {
  readonly registry?: TagRegistry;
}

export function validateStatus(
  status: string,
  options?: FSMValidationOptions,
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
  if (isTerminalState(status)) {
    warnings.push(
      `Status 'completed' is the settled end state; it reopens to active or roadmap. ` +
        `Editing or reopening it warns (advisory) — ${tagPrefix}unlock-reason is optional and suppresses the warning.`,
    );
  }

  return {
    valid: true,
    status,
    ...(warnings.length > 0 && { warnings }),
  };
}

export function validateTransition(from: string, to: string): TransitionValidationResult {
  if (!isValidStatusValue(from)) {
    return {
      valid: false,
      from,
      to,
      error: `Invalid source status '${from}'. Valid values: ${PROCESS_STATUS_VALUES.join(', ')}.`,
    };
  }

  if (!isValidStatusValue(to)) {
    return {
      valid: false,
      from,
      to,
      error: `Invalid target status '${to}'. Valid values: ${PROCESS_STATUS_VALUES.join(', ')}.`,
    };
  }

  const validTargets = VALID_TRANSITIONS[from];
  if (validTargets.includes(to)) {
    return { valid: true, from, to };
  }

  return {
    valid: false,
    from,
    to,
    error: getTransitionErrorMessage(from, to),
    validAlternatives: getValidTransitionsFrom(from),
  };
}

export function validatePatternStatus(
  pattern: PatternMetadata,
  options?: FSMValidationOptions,
): {
  valid: boolean;
  statusResult: StatusValidationResult;
  allWarnings: string[];
} {
  const statusResult = validateStatus(pattern.status, options);
  const allWarnings = [...(statusResult.warnings ?? [])];

  return {
    valid: statusResult.valid,
    statusResult,
    allWarnings,
  };
}

/**
 * Summarize the protection a status carries, under the advisory model (PDR-006).
 *
 * Protection LEVEL (`none`/`scope`/`hard`) is the FSM-derived strength of
 * guarding and is independent of ENFORCEMENT SEVERITY: on the commit path,
 * scope-creep (active) and completed-spec edits surface advisory WARNINGS, not
 * blocks. `${prefix}unlock-reason` is optional and, when present, suppresses the
 * warning — it is never required. (`--strict`, used by CI, may promote these
 * warnings to blocking, but that is a mode lever, not a property of the level.)
 *
 * `unlockSuppressesWarning` reports whether this level emits an advisory,
 * unlock-suppressible warning — true for `scope` (active scope creep) and `hard`
 * (completed edits), mirroring `ProcessGuardDecider` exactly.
 */
export function getProtectionSummary(
  status: ProcessStatusValue,
  options?: FSMValidationOptions,
): {
  level: ProtectionLevel;
  description: string;
  canAddDeliverables: boolean;
  unlockSuppressesWarning: boolean;
} {
  const tagPrefix = options?.registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;
  const level = getProtectionLevel(status);

  const descriptions: Record<ProtectionLevel, string> = {
    none: 'Fully editable - no restrictions',
    scope: `Scope-locked (advisory) - adding pending deliverables warns; ${tagPrefix}unlock-reason suppresses it`,
    hard: `Completed (advisory) - editing or reopening warns; ${tagPrefix}unlock-reason is optional and suppresses it`,
  };

  return {
    level,
    description: descriptions[level],
    canAddDeliverables: level === 'none',
    unlockSuppressesWarning: level !== 'none',
  };
}
