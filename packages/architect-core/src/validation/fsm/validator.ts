/**
 * @architect
 * @architect-validation
 * @architect-pattern FSMValidator
 * @architect-status active
 * @architect-uses FSMTransitions, FSMStates
 * @architect-role:decider
 * @architect-bounded-context:validation
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
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

export interface CompletionMetadataValidationResult {
  valid: boolean;
  warnings: string[];
}

export interface PatternMetadata {
  status: string;
  completed?: string;
  effortActual?: string;
  effortPlanned?: string;
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
      `Status 'completed' is a terminal state. Use ${tagPrefix}unlock-reason to modify.`,
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

export function validateCompletionMetadata(
  pattern: PatternMetadata,
  options?: FSMValidationOptions,
): CompletionMetadataValidationResult {
  const tagPrefix = options?.registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;
  const warnings: string[] = [];

  if (pattern.status !== 'completed') {
    return { valid: true, warnings: [] };
  }

  if (!pattern.completed) {
    warnings.push(`Completed pattern missing ${tagPrefix}completed date.`);
  }

  if (pattern.effortPlanned && !pattern.effortActual) {
    warnings.push(
      `Pattern has ${tagPrefix}effort but missing ${tagPrefix}effort-actual. ` +
        'Consider adding actual effort for tracking.',
    );
  }

  return { valid: true, warnings };
}

export function validatePatternStatus(
  pattern: PatternMetadata,
  options?: FSMValidationOptions,
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

export function getProtectionSummary(
  status: ProcessStatusValue,
  options?: FSMValidationOptions,
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
