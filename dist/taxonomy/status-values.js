/**
 * Process workflow status values (per PDR-005 FSM)
 *
 * THE single source of truth for FSM state values in the monorepo.
 *
 * FSM transitions:
 * - roadmap → active (start work)
 * - active → completed (finish work)
 * - active → deferred (pause work)
 * - deferred → active (resume work)
 *
 * @see PDR-005 MVP Workflow State Machine
 * @see ACCEPTED_STATUS_VALUES for extraction/validation (includes legacy)
 * @see normalized-status.ts for normalization mapping
 */
export const PROCESS_STATUS_VALUES = [
    'roadmap', // Planned work, fully editable
    'active', // In progress, scope-locked
    'completed', // Done, hard-locked
    'deferred', // On hold, fully editable
];
/**
 * Extended status values accepted for extraction and validation
 *
 * FSM states that can be used in annotations.
 * Use only these canonical values: roadmap, active, completed, deferred.
 */
export const ACCEPTED_STATUS_VALUES = [...PROCESS_STATUS_VALUES];
/**
 * Default status for new items
 */
export const DEFAULT_STATUS = 'roadmap';
//# sourceMappingURL=status-values.js.map