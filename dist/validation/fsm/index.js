/**
 * @libar-docs
 * @libar-docs-validation
 * @libar-docs-pattern FSMModule
 * @libar-docs-status active
 * @libar-docs-depends-on:PDR005MvpWorkflow
 *
 * ## FSM Module - Phase State Machine Implementation
 *
 * Central export for the 4-state FSM defined in PDR-005:
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
 * ### Module Contents
 *
 * - **states.ts** - Status states and protection levels
 * - **transitions.ts** - Valid transition matrix
 * - **validator.ts** - Pure validation functions (Decider pattern)
 *
 * ### Usage Example
 *
 * ```typescript
 * import {
 *   validateStatus,
 *   validateTransition,
 *   getProtectionLevel,
 *   isValidTransition
 * } from "@libar-dev/delivery-process/validation/fsm";
 *
 * // Validate a status value
 * const result = validateStatus("roadmap");
 * if (result.valid) {
 *   console.log("Valid status");
 * }
 *
 * // Check transition validity
 * if (isValidTransition("roadmap", "active")) {
 *   console.log("Can start work");
 * }
 * ```
 */
// States - Protection levels and state queries
export { PROTECTION_LEVELS, getProtectionLevel, isTerminalState, isFullyEditable, isScopeLocked, 
// Re-exported from taxonomy for convenience
PROCESS_STATUS_VALUES, } from "./states.js";
// Transitions - Valid transition matrix and queries
export { VALID_TRANSITIONS, isValidTransition, getValidTransitionsFrom, getTransitionErrorMessage, } from "./transitions.js";
// Validator - Pure validation functions
export { validateStatus, validateTransition, validateCompletionMetadata, validatePatternStatus, getProtectionSummary, } from "./validator.js";
//# sourceMappingURL=index.js.map