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
 * FSM transitions:
 * - roadmap to active (start work)
 * - roadmap to deferred (pause before start)
 * - deferred to roadmap (resume planning)
 * - active to completed (finish work)
 * - active to deferred (pause work)
 * - deferred to active (resume work)
 * - active cannot regress to roadmap
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
/**
 * Pre-built set of valid process statuses for O(1) membership checks.
 */
export const VALID_PROCESS_STATUS_SET = new Set(PROCESS_STATUS_VALUES);
//# sourceMappingURL=status-values.js.map