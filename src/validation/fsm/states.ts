/**
 * @libar-docs
 * @libar-docs-extract-shapes PROTECTION_LEVELS, ProtectionLevel, getProtectionLevel, isTerminalState, isFullyEditable, isScopeLocked
 * @libar-docs-validation
 * @libar-docs-pattern FSMStates
 * @libar-docs-status active
 * @libar-docs-implements PhaseStateMachineValidation
 * @libar-docs-depends-on:PDR005MvpWorkflow
 * @libar-docs-arch-role read-model
 * @libar-docs-arch-context validation
 * @libar-docs-arch-layer domain
 *
 * ## FSM States - Process Status States and Protection Levels
 *
 * Defines the 4-state FSM from PDR-005 MVP Workflow:
 * - roadmap: Planned work (fully editable)
 * - active: Work in progress (scope-locked)
 * - completed: Done (hard-locked, requires unlock)
 * - deferred: On hold (fully editable)
 *
 * ### When to Use
 *
 * - Use `getProtectionLevel()` to determine modification restrictions
 * - Use `isTerminalState()` to check if state allows transitions
 * - Use `PROTECTION_LEVELS` for direct lookups
 */

import { PROCESS_STATUS_VALUES, type ProcessStatusValue } from '../../taxonomy/index.js';

/**
 * Protection level types for FSM states
 *
 * - `none`: Fully editable, no restrictions
 * - `scope`: Scope-locked, prevents adding new deliverables
 * - `hard`: Hard-locked, requires explicit unlock-reason annotation
 */
export type ProtectionLevel = 'none' | 'scope' | 'hard';

/**
 * Protection level mapping per PDR-005
 *
 * | State     | Protection | Meaning                          |
 * |-----------|------------|----------------------------------|
 * | roadmap   | none       | Planning phase, fully editable   |
 * | active    | scope      | In progress, no new deliverables |
 * | completed | hard       | Done, requires unlock to modify  |
 * | deferred  | none       | Parked, fully editable           |
 */
export const PROTECTION_LEVELS: Readonly<Record<ProcessStatusValue, ProtectionLevel>> = {
  roadmap: 'none',
  active: 'scope',
  completed: 'hard',
  deferred: 'none',
} as const;

/**
 * Get the protection level for a status
 *
 * @param status - Process status value
 * @returns Protection level for the status
 *
 * @example
 * ```typescript
 * getProtectionLevel("active"); // → "scope"
 * getProtectionLevel("completed"); // → "hard"
 * ```
 */
export function getProtectionLevel(status: ProcessStatusValue): ProtectionLevel {
  return PROTECTION_LEVELS[status];
}

/**
 * Check if a status is a terminal state (cannot transition out)
 *
 * Terminal states require explicit unlock to modify.
 *
 * @param status - Process status value
 * @returns true if the status is terminal
 *
 * @example
 * ```typescript
 * isTerminalState("completed"); // → true
 * isTerminalState("active"); // → false
 * ```
 */
export function isTerminalState(status: ProcessStatusValue): boolean {
  return status === 'completed';
}

/**
 * Check if a status is fully editable (no protection)
 *
 * @param status - Process status value
 * @returns true if the status has no protection
 */
export function isFullyEditable(status: ProcessStatusValue): boolean {
  return PROTECTION_LEVELS[status] === 'none';
}

/**
 * Check if a status is scope-locked
 *
 * @param status - Process status value
 * @returns true if the status prevents scope changes
 */
export function isScopeLocked(status: ProcessStatusValue): boolean {
  return PROTECTION_LEVELS[status] === 'scope';
}

/**
 * Re-export status values for convenience
 */
export { PROCESS_STATUS_VALUES, type ProcessStatusValue };
