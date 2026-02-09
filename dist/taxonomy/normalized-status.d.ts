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
export declare const NORMALIZED_STATUS_VALUES: readonly ["completed", "active", "planned"];
export type NormalizedStatus = (typeof NORMALIZED_STATUS_VALUES)[number];
/**
 * Maps raw status values → normalized display status
 *
 * Includes both:
 * Canonical taxonomy values (per PDR-005 FSM)
 */
export declare const STATUS_NORMALIZATION_MAP: Readonly<Record<string, NormalizedStatus>>;
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
export declare function normalizeStatus(status: string | undefined): NormalizedStatus;
/**
 * Check if a pattern's FSM status normalizes to "completed"
 *
 * Use this for **pattern-level** status checks (FSM-governed, 4 values).
 * For **deliverable-level** status checks (canonical enum: complete/in-progress/pending/
 * deferred/superseded/n/a), use `isDeliverableStatusComplete()` from
 * `taxonomy/deliverable-status.ts` instead.
 *
 * @param status - Raw pattern status from ExtractedPattern.status
 * @returns True if the pattern is completed
 */
export declare function isPatternComplete(status: string | undefined): boolean;
/**
 * Check if a pattern's FSM status normalizes to "active"
 *
 * Use this for **pattern-level** status checks (FSM-governed, 4 values).
 * For **deliverable-level** status checks (canonical enum),
 * use `isDeliverableStatusInProgress()` from `taxonomy/deliverable-status.ts` instead.
 *
 * @param status - Raw pattern status from ExtractedPattern.status
 * @returns True if the pattern is active
 */
export declare function isPatternActive(status: string | undefined): boolean;
/**
 * Check if a pattern's FSM status normalizes to "planned"
 *
 * Includes both "roadmap" and "deferred" FSM states, as well as
 * undefined/unknown statuses. Use this for **pattern-level** status checks.
 * For **deliverable-level** status checks, use `isDeliverableStatusPending()` from
 * `taxonomy/deliverable-status.ts` instead.
 *
 * @param status - Raw pattern status from ExtractedPattern.status
 * @returns True if the pattern is planned (roadmap, deferred, or unknown)
 */
export declare function isPatternPlanned(status: string | undefined): boolean;
//# sourceMappingURL=normalized-status.d.ts.map