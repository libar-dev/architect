/**
 * @libar-docs
 * @libar-docs-pattern DeliverableStatusTaxonomy
 * @libar-docs-status active
 * @libar-docs-core
 * @libar-docs-extract-shapes DELIVERABLE_STATUS_VALUES, DeliverableStatus, VALID_DELIVERABLE_STATUS_SET, DEFAULT_DELIVERABLE_STATUS, isDeliverableStatusComplete, isDeliverableStatusInProgress, isDeliverableStatusPending, isDeliverableStatusTerminal, getDeliverableStatusEmoji
 *
 * ## Deliverable Status Taxonomy
 *
 * Canonical status values for deliverables in Gherkin Background tables.
 *
 * The delivery-process system uses two distinct status domains:
 *
 * 1. Pattern status (FSM-governed, 4 values in status-values.ts):
 *    roadmap, active, completed, deferred — validated by ProcessStatusSchema
 *
 * 2. Deliverable status (this file, 6 values):
 *    complete, in-progress, pending, deferred, superseded, n/a —
 *    validated by DeliverableSchema via z.enum(DELIVERABLE_STATUS_VALUES)
 *
 * Previously, deliverable status was z.string() with 29-pattern fuzzy
 * matching at read-time. This caused 3 real bugs (drift campaign 10bab44).
 * Now enforced at schema level like pattern status.
 */
/**
 * Canonical deliverable status values
 *
 * These are the ONLY accepted values for the Status column in
 * Gherkin Background deliverable tables. Values are lowercased
 * at extraction time before schema validation.
 *
 * - complete: Work is done
 * - in-progress: Work is ongoing
 * - pending: Work hasn't started
 * - deferred: Work postponed
 * - superseded: Replaced by another deliverable
 * - n/a: Not applicable
 *
 * @libar-docs-shape reference-sample
 */
export const DELIVERABLE_STATUS_VALUES = [
    'complete',
    'in-progress',
    'pending',
    'deferred',
    'superseded',
    'n/a',
];
/**
 * Default status for new deliverables
 */
export const DEFAULT_DELIVERABLE_STATUS = 'pending';
/**
 * Pre-built set of valid deliverable statuses for O(1) membership checks.
 */
export const VALID_DELIVERABLE_STATUS_SET = new Set(DELIVERABLE_STATUS_VALUES);
// ============================================================================
// Deliverable Status Helpers
// ============================================================================
/**
 * Check if a deliverable status indicates completion.
 *
 * Use this for **deliverable-level** status checks (6 canonical values).
 * For **pattern-level** FSM status checks, use `isPatternComplete()`
 * from `normalized-status.ts` instead.
 */
export function isDeliverableStatusComplete(status) {
    return status === 'complete';
}
/**
 * Check if a deliverable status indicates work in progress.
 *
 * Use this for **deliverable-level** status checks.
 * For **pattern-level** FSM status checks, use `isPatternActive()`
 * from `normalized-status.ts` instead.
 */
export function isDeliverableStatusInProgress(status) {
    return status === 'in-progress';
}
/**
 * Check if a deliverable status indicates pending/not-started.
 *
 * Use this for **deliverable-level** status checks.
 * For **pattern-level** FSM status checks, use `isPatternPlanned()`
 * from `normalized-status.ts` instead.
 */
export function isDeliverableStatusPending(status) {
    return status === 'pending';
}
/**
 * Check if a deliverable status is terminal (no further work expected).
 *
 * Terminal statuses are acceptable for DoD validation on completed patterns:
 * - `complete`: Work is done
 * - `n/a`: Not applicable — consciously excluded
 * - `superseded`: Replaced by another deliverable
 *
 * Note: `deferred` is NOT terminal — it means "postponed," implying
 * unfinished work that should block DoD.
 */
export function isDeliverableStatusTerminal(status) {
    return status === 'complete' || status === 'n/a' || status === 'superseded';
}
/**
 * Get the appropriate emoji for a deliverable status.
 *
 * Maps the 6 canonical deliverable statuses to display emojis.
 *
 * Note: This is for deliverable statuses (6 canonical values),
 * NOT for FSM pattern statuses (roadmap/active/completed/deferred) —
 * use `getStatusEmoji()` from `renderable/utils.ts` for those.
 */
export function getDeliverableStatusEmoji(status) {
    switch (status) {
        case 'complete':
            return '✅';
        case 'in-progress':
            return '🚧';
        case 'pending':
            return '📋';
        case 'deferred':
            return '⏸️';
        case 'superseded':
            return '🔄';
        case 'n/a':
            return '➖';
    }
}
//# sourceMappingURL=deliverable-status.js.map