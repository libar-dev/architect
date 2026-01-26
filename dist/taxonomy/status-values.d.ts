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
export declare const PROCESS_STATUS_VALUES: readonly ["roadmap", "active", "completed", "deferred"];
/**
 * Extended status values accepted for extraction and validation
 *
 * Includes FSM states plus legacy values for backward compatibility.
 * Legacy values are normalized to FSM states via normalizeStatus().
 *
 * @see normalized-status.ts for normalization mapping
 */
export declare const ACCEPTED_STATUS_VALUES: readonly ["roadmap", "active", "completed", "deferred", "implemented", "partial", "in-progress"];
export type AcceptedStatusValue = (typeof ACCEPTED_STATUS_VALUES)[number];
export type ProcessStatusValue = (typeof PROCESS_STATUS_VALUES)[number];
/**
 * Default status for new items
 */
export declare const DEFAULT_STATUS: ProcessStatusValue;
//# sourceMappingURL=status-values.d.ts.map