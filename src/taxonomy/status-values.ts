/**
 * @libar-docs
 * @libar-docs-pattern StatusValues
 * @libar-docs-status completed
 * @libar-docs-core
 * @libar-docs-extract-shapes PROCESS_STATUS_VALUES, ProcessStatusValue, ACCEPTED_STATUS_VALUES, AcceptedStatusValue, DEFAULT_STATUS, VALID_PROCESS_STATUS_SET
 *
 * ## Process Workflow Status Values
 *
 * THE single source of truth for FSM state values in the monorepo (per PDR-005 FSM).
 *
 * FSM transitions (canonical source: src/validation/fsm/transitions.ts):
 * - roadmap to active (start work)
 * - roadmap to deferred (postpone)
 * - deferred to roadmap (resume planning)
 * - active to completed (finish work)
 * - active to roadmap (blocked/regressed)
 *
 * **When to Use:** When validating or referencing FSM state values — import these constants instead of hardcoding status strings.
 */
export const PROCESS_STATUS_VALUES = [
  'roadmap', // Planned work, fully editable
  'active', // In progress, scope-locked
  'completed', // Done, hard-locked
  'deferred', // On hold, fully editable
] as const;

/**
 * Extended status values accepted for extraction and validation
 *
 * FSM states that can be used in annotations.
 * Use only these canonical values: roadmap, active, completed, deferred.
 */
export const ACCEPTED_STATUS_VALUES = [...PROCESS_STATUS_VALUES] as const;

export type AcceptedStatusValue = (typeof ACCEPTED_STATUS_VALUES)[number];

export type ProcessStatusValue = (typeof PROCESS_STATUS_VALUES)[number];

/**
 * Default status for new items
 */
export const DEFAULT_STATUS: ProcessStatusValue = 'roadmap';

/**
 * Pre-built set of valid process statuses for O(1) membership checks.
 */
export const VALID_PROCESS_STATUS_SET: ReadonlySet<string> = new Set<string>(PROCESS_STATUS_VALUES);
