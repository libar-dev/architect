/**
 * @libar-docs
 * @libar-docs-validation
 * @libar-docs-pattern FSMTransitions
 * @libar-docs-status active
 * @libar-docs-depends-on:PDR005MvpWorkflow
 *
 * ## FSM Transitions - Valid State Transition Matrix
 *
 * Defines valid transitions between FSM states per PDR-005:
 *
 * ```
 * roadmap ──→ active ──→ completed
 *    │          │
 *    │          ↓
 *    │       roadmap (blocked/regressed)
 *    │
 *    ↓
 * deferred ──→ roadmap
 * ```
 *
 * ### When to Use
 *
 * - Use `isValidTransition()` to validate proposed status changes
 * - Use `getValidTransitionsFrom()` to show available options
 */
import type { ProcessStatusValue } from "../../taxonomy/index.js";
import type { TagRegistry } from "../../validation-schemas/tag-registry.js";
/**
 * Options for transition functions that generate messages
 */
export interface TransitionMessageOptions {
    /** Tag registry for prefix-aware error messages (optional) */
    readonly registry?: TagRegistry;
}
/**
 * Valid FSM transitions matrix
 *
 * Maps each state to the list of states it can transition to.
 *
 * | From      | Valid Targets              | Notes                        |
 * |-----------|----------------------------|------------------------------|
 * | roadmap   | active, deferred, roadmap  | Can start, park, or stay     |
 * | active    | completed, roadmap         | Can finish or regress        |
 * | completed | (none)                     | Terminal state               |
 * | deferred  | roadmap                    | Must go through roadmap      |
 */
export declare const VALID_TRANSITIONS: Readonly<Record<ProcessStatusValue, readonly ProcessStatusValue[]>>;
/**
 * Check if a transition between two states is valid
 *
 * @param from - Current status
 * @param to - Target status
 * @returns true if the transition is allowed
 *
 * @example
 * ```typescript
 * isValidTransition("roadmap", "active"); // → true
 * isValidTransition("roadmap", "completed"); // → false (must go through active)
 * isValidTransition("completed", "active"); // → false (terminal state)
 * ```
 */
export declare function isValidTransition(from: ProcessStatusValue, to: ProcessStatusValue): boolean;
/**
 * Get all valid transitions from a given state
 *
 * @param status - Current status
 * @returns Array of valid target states (empty for terminal states)
 *
 * @example
 * ```typescript
 * getValidTransitionsFrom("roadmap"); // → ["active", "deferred", "roadmap"]
 * getValidTransitionsFrom("completed"); // → []
 * ```
 */
export declare function getValidTransitionsFrom(status: ProcessStatusValue): readonly ProcessStatusValue[];
/**
 * Get a human-readable description of why a transition is invalid
 *
 * @param from - Current status
 * @param to - Attempted target status
 * @param options - Optional message options with registry for prefix
 * @returns Error message describing the violation
 *
 * @example
 * ```typescript
 * getTransitionErrorMessage("roadmap", "completed");
 * // → "Cannot transition from 'roadmap' to 'completed'. Must go through 'active' first."
 *
 * getTransitionErrorMessage("completed", "active");
 * // → "Cannot transition from 'completed' (terminal state). Use unlock-reason tag to modify."
 * ```
 */
export declare function getTransitionErrorMessage(from: ProcessStatusValue, to: ProcessStatusValue, options?: TransitionMessageOptions): string;
//# sourceMappingURL=transitions.d.ts.map