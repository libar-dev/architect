/**
 * @architect
 * @architect-validation
 * @architect-pattern FSMStates
 * @architect-status active
 * @architect-role:read-model
 * @architect-bounded-context:validation
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */

import { PROCESS_STATUS_VALUES, type ProcessStatusValue } from '../../taxonomy/index.js';

export type ProtectionLevel = 'none' | 'scope' | 'hard';

export const PROTECTION_LEVELS: Readonly<Record<ProcessStatusValue, ProtectionLevel>> = {
  roadmap: 'none',
  active: 'scope',
  completed: 'hard',
  deferred: 'none',
} as const;

export function getProtectionLevel(status: ProcessStatusValue): ProtectionLevel {
  return PROTECTION_LEVELS[status];
}

export function isTerminalState(status: ProcessStatusValue): boolean {
  return status === 'completed';
}

export function isFullyEditable(status: ProcessStatusValue): boolean {
  return PROTECTION_LEVELS[status] === 'none';
}

export function isScopeLocked(status: ProcessStatusValue): boolean {
  return PROTECTION_LEVELS[status] === 'scope';
}

export { PROCESS_STATUS_VALUES, type ProcessStatusValue };
