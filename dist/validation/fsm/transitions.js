/**
 * @libar-docs
 * @libar-docs-validation
 * @libar-docs-pattern FSMTransitions
 * @libar-docs-status active
 * @libar-docs-implements PhaseStateMachineValidation
 * @libar-docs-depends-on:PDR005MvpWorkflow
 * @libar-docs-extract-shapes VALID_TRANSITIONS, isValidTransition, getValidTransitionsFrom, getTransitionErrorMessage
 * @libar-docs-arch-role read-model
 * @libar-docs-arch-context validation
 * @libar-docs-arch-layer domain
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
import { DEFAULT_TAG_PREFIX } from '../../config/defaults.js';
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
export const VALID_TRANSITIONS = {
    roadmap: ['active', 'deferred', 'roadmap'], // Can start work, park, or stay in planning
    active: ['completed', 'roadmap'], // Can finish or regress if blocked
    completed: [], // Terminal state - no transitions allowed
    deferred: ['roadmap'], // Must reactivate through roadmap first
};
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
export function isValidTransition(from, to) {
    const validTargets = VALID_TRANSITIONS[from];
    return validTargets.includes(to);
}
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
export function getValidTransitionsFrom(status) {
    return VALID_TRANSITIONS[status];
}
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
export function getTransitionErrorMessage(from, to, options) {
    const tagPrefix = options?.registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;
    // Handle terminal state
    if (from === 'completed') {
        return `Cannot transition from 'completed' (terminal state). Use ${tagPrefix}unlock-reason to modify.`;
    }
    // Handle skipping active (roadmap → completed)
    if (from === 'roadmap' && to === 'completed') {
        return `Cannot transition from 'roadmap' to 'completed'. Must go through 'active' first.`;
    }
    // Handle deferred shortcuts
    if (from === 'deferred' && (to === 'active' || to === 'completed')) {
        return `Cannot transition from 'deferred' to '${to}'. Must reactivate to 'roadmap' first.`;
    }
    // Generic message
    const validTargets = VALID_TRANSITIONS[from];
    if (validTargets.length === 0) {
        return `Cannot transition from '${from}' (terminal state).`;
    }
    return `Invalid transition from '${from}' to '${to}'. Valid targets: ${validTargets.join(', ')}.`;
}
//# sourceMappingURL=transitions.js.map