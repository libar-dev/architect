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
 * ### When to Use
 *
 * - When validating status transitions in pre-commit hooks
 * - When checking protection levels for completed patterns
 * - When implementing workflow enforcement in CI/CD
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
export { PROTECTION_LEVELS, type ProtectionLevel, getProtectionLevel, isTerminalState, isFullyEditable, isScopeLocked, PROCESS_STATUS_VALUES, type ProcessStatusValue, } from './states.js';
export { VALID_TRANSITIONS, isValidTransition, getValidTransitionsFrom, getTransitionErrorMessage, type TransitionMessageOptions, } from './transitions.js';
export { type StatusValidationResult, type TransitionValidationResult, type CompletionMetadataValidationResult, type PatternMetadata, type FSMValidationOptions, validateStatus, validateTransition, validateCompletionMetadata, validatePatternStatus, getProtectionSummary, } from './validator.js';
//# sourceMappingURL=index.d.ts.map