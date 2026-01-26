/**
 * Normalized status values for display purposes
 *
 * The delivery-process system uses a two-level status taxonomy:
 *
 * 1. **Raw status** (PROCESS_STATUS_VALUES in status-values.ts):
 *    The 4 FSM states stored in data: roadmap, active, completed, deferred
 *
 * 2. **Normalized status** (this file):
 *    The 3 display buckets for UI presentation
 *
 * This separation follows DDD principles - the domain model (raw) is
 * distinct from the view model (normalized).
 *
 * @see status-values.ts for raw FSM status values
 * @see PDR-005 MVP Workflow State Machine
 */

/**
 * Normalized status values for display
 *
 * Maps raw FSM states to three presentation buckets:
 * - completed: Work is done
 * - active: Work in progress
 * - planned: Future work (includes roadmap and deferred)
 */
export const NORMALIZED_STATUS_VALUES = ["completed", "active", "planned"] as const;

export type NormalizedStatus = (typeof NORMALIZED_STATUS_VALUES)[number];

/**
 * Maps raw status values → normalized display status
 *
 * Includes both:
 * - Current taxonomy values (per PDR-005)
 * - Legacy values (for display backward compatibility)
 */
export const STATUS_NORMALIZATION_MAP: Readonly<Record<string, NormalizedStatus>> = {
  // Current taxonomy values (per PDR-005 FSM)
  completed: "completed",
  active: "active",
  roadmap: "planned",
  deferred: "planned",
  // Legacy values (for display backward compat with existing data)
  implemented: "completed",
  partial: "active",
  "in-progress": "active",
  planned: "planned",
};

/**
 * Normalize any status string to a display bucket
 *
 * Maps various status values to three canonical display states:
 * - "completed": implemented, completed
 * - "active": active, partial, in-progress
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
 * normalizeStatus("implemented") // → "completed" (legacy)
 * normalizeStatus("active")      // → "active"
 * normalizeStatus("partial")     // → "active" (legacy)
 * normalizeStatus("roadmap")     // → "planned"
 * normalizeStatus("deferred")    // → "planned"
 * normalizeStatus(undefined)     // → "planned"
 * ```
 */
export function normalizeStatus(status: string | undefined): NormalizedStatus {
  if (!status) return "planned";
  return STATUS_NORMALIZATION_MAP[status.toLowerCase()] ?? "planned";
}
