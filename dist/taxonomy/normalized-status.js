/**
 * @libar-docs
 * @libar-docs-pattern NormalizedStatus
 * @libar-docs-status completed
 * @libar-docs-core
 * @libar-docs-extract-shapes NORMALIZED_STATUS_VALUES, NormalizedStatus, STATUS_NORMALIZATION_MAP, normalizeStatus
 *
 * ## Normalized Status Values for Display
 *
 * The delivery-process system uses a two-level status taxonomy:
 *
 * 1. Raw status (PROCESS_STATUS_VALUES in status-values.ts):
 *    The 4 FSM states stored in data: roadmap, active, completed, deferred
 *
 * 2. Normalized status (this file):
 *    The 3 display buckets for UI presentation
 *
 * This separation follows DDD principles - the domain model (raw) is
 * distinct from the view model (normalized).
 */
/**
 * Normalized status values for display
 *
 * Maps raw FSM states to three presentation buckets:
 * - completed: Work is done
 * - active: Work in progress
 * - planned: Future work (includes roadmap and deferred)
 */
export const NORMALIZED_STATUS_VALUES = ['completed', 'active', 'planned'];
/**
 * Maps raw status values → normalized display status
 *
 * Includes both:
 * Canonical taxonomy values (per PDR-005 FSM)
 */
export const STATUS_NORMALIZATION_MAP = {
    completed: 'completed',
    active: 'active',
    roadmap: 'planned',
    deferred: 'planned',
    planned: 'planned',
};
/**
 * Normalize any status string to a display bucket
 *
 * Maps status values to three canonical display states:
 * - "completed": completed
 * - "active": active
 * - "planned": roadmap, deferred, planned, or any unknown value
 *
 * Per PDR-005: deferred items are treated as planned (not actively worked on)
 *
 * @param status - Raw status from pattern (case-insensitive)
 * @returns "completed" | "active" | "planned"
 *
 * @example
 * ```typescript
 * normalizeStatus("completed")   // → "completed"
 * normalizeStatus("active")      // → "active"
 * normalizeStatus("roadmap")     // → "planned"
 * normalizeStatus("deferred")    // → "planned"
 * normalizeStatus(undefined)     // → "planned"
 * ```
 */
export function normalizeStatus(status) {
    if (!status)
        return 'planned';
    return STATUS_NORMALIZATION_MAP[status.toLowerCase()] ?? 'planned';
}
//# sourceMappingURL=normalized-status.js.map