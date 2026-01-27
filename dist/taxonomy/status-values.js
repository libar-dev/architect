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
 * Includes FSM states plus legacy values for backward compatibility.
 * Legacy values are normalized to FSM states via normalizeStatus().
 *
 * @see normalized-status.ts for normalization mapping
 */
export const ACCEPTED_STATUS_VALUES = [
    ...PROCESS_STATUS_VALUES,
    'implemented', // Legacy → normalized to "completed"
    'partial', // Legacy → normalized to "active"
    'in-progress', // Legacy → normalized to "active"
];
/**
 * Default status for new items
 */
export const DEFAULT_STATUS = 'roadmap';
//# sourceMappingURL=status-values.js.map