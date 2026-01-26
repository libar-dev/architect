/**
 * @libar-docs
 * @libar-docs-validation
 * @libar-docs-pattern FSMValidator
 * @libar-docs-status active
 * @libar-docs-depends-on:PDR005MvpWorkflow
 *
 * ## FSM Validator - Pure Validation Functions
 *
 * Pure validation functions following the Decider pattern:
 * - No I/O, no side effects
 * - Return structured results, never throw
 * - Composable and testable
 *
 * ### When to Use
 *
 * - Use `validateStatus()` to validate status values before processing
 * - Use `validateTransition()` to check proposed status changes
 * - Use `validateCompletionMetadata()` to enforce completed state requirements
 */
import { PROCESS_STATUS_VALUES } from "../../taxonomy/index.js";
import { VALID_TRANSITIONS, getValidTransitionsFrom, getTransitionErrorMessage, } from "./transitions.js";
import { isTerminalState, getProtectionLevel } from "./states.js";
/**
 * Default tag prefix for error messages when no registry is provided.
 */
const DEFAULT_TAG_PREFIX = "@libar-docs-";
/**
 * Check if a string is a valid ProcessStatusValue
 */
function isValidStatusValue(status) {
    return PROCESS_STATUS_VALUES.includes(status);
}
/**
 * Validate a status value against PDR-005 FSM
 *
 * @param status - Status value to validate
 * @param options - Optional validation options with registry
 * @returns Validation result with error/warnings
 *
 * @example
 * ```typescript
 * validateStatus("roadmap"); // → { valid: true, status: "roadmap" }
 * validateStatus("done"); // → { valid: false, status: "done", error: "Invalid status..." }
 * ```
 */
export function validateStatus(status, options) {
    const tagPrefix = options?.registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;
    if (!isValidStatusValue(status)) {
        return {
            valid: false,
            status,
            error: `Invalid status '${status}'. Valid values: ${PROCESS_STATUS_VALUES.join(", ")}.`,
        };
    }
    const warnings = [];
    // Add contextual warnings for terminal state
    if (isTerminalState(status)) {
        warnings.push(`Status 'completed' is a terminal state. Use ${tagPrefix}unlock-reason to modify.`);
    }
    return {
        valid: true,
        status,
        ...(warnings.length > 0 && { warnings }),
    };
}
/**
 * Validate a status transition against FSM rules
 *
 * @param from - Current status
 * @param to - Target status
 * @returns Validation result with alternatives if invalid
 *
 * @example
 * ```typescript
 * validateTransition("roadmap", "active");
 * // → { valid: true, from: "roadmap", to: "active" }
 *
 * validateTransition("roadmap", "completed");
 * // → { valid: false, from: "roadmap", to: "completed",
 * //     error: "Cannot transition...", validAlternatives: ["active", "deferred", "roadmap"] }
 * ```
 */
export function validateTransition(from, to) {
    // First validate both status values
    if (!isValidStatusValue(from)) {
        return {
            valid: false,
            from: from, // Type assertion for interface compliance
            to: to,
            error: `Invalid source status '${from}'. Valid values: ${PROCESS_STATUS_VALUES.join(", ")}.`,
        };
    }
    if (!isValidStatusValue(to)) {
        return {
            valid: false,
            from,
            to: to,
            error: `Invalid target status '${to}'. Valid values: ${PROCESS_STATUS_VALUES.join(", ")}.`,
        };
    }
    // Check if transition is valid
    const validTargets = VALID_TRANSITIONS[from];
    if (validTargets.includes(to)) {
        return {
            valid: true,
            from,
            to,
        };
    }
    // Invalid transition - provide helpful error and alternatives
    return {
        valid: false,
        from,
        to,
        error: getTransitionErrorMessage(from, to),
        validAlternatives: getValidTransitionsFrom(from),
    };
}
/**
 * Validate completion metadata requirements
 *
 * When a pattern has status "completed", it should have:
 * - completed date tag (warning if missing)
 * - effort-actual tag (warning if effort-planned exists but actual doesn't)
 *
 * @param pattern - Pattern metadata to validate
 * @param options - Optional validation options with registry
 * @returns Validation result with warnings
 *
 * @example
 * ```typescript
 * validateCompletionMetadata({ status: "completed" });
 * // → { valid: true, warnings: ["Completed pattern missing completed date tag"] }
 *
 * validateCompletionMetadata({ status: "completed", completed: "2026-01-09" });
 * // → { valid: true, warnings: [] }
 * ```
 */
export function validateCompletionMetadata(pattern, options) {
    const tagPrefix = options?.registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;
    const warnings = [];
    // Only check completion requirements for completed status
    if (pattern.status !== "completed") {
        return { valid: true, warnings: [] };
    }
    // Check for completion date
    if (!pattern.completed) {
        warnings.push(`Completed pattern missing ${tagPrefix}completed date.`);
    }
    // Check for effort tracking consistency
    if (pattern.effortPlanned && !pattern.effortActual) {
        warnings.push(`Pattern has ${tagPrefix}effort but missing ${tagPrefix}effort-actual. ` +
            "Consider adding actual effort for tracking.");
    }
    return {
        valid: true,
        warnings,
    };
}
/**
 * Full validation of a pattern's status and metadata
 *
 * Combines status validation with completion metadata checks.
 *
 * @param pattern - Pattern metadata to validate
 * @param options - Optional validation options with registry
 * @returns Combined validation result
 */
export function validatePatternStatus(pattern, options) {
    const statusResult = validateStatus(pattern.status, options);
    const completionResult = validateCompletionMetadata(pattern, options);
    const allWarnings = [...(statusResult.warnings ?? []), ...completionResult.warnings];
    return {
        valid: statusResult.valid && completionResult.valid,
        statusResult,
        completionResult,
        allWarnings,
    };
}
/**
 * Get a summary of FSM protection for a status
 *
 * @param status - Status to describe
 * @param options - Optional validation options with registry
 * @returns Human-readable protection description
 */
export function getProtectionSummary(status, options) {
    const tagPrefix = options?.registry?.tagPrefix ?? DEFAULT_TAG_PREFIX;
    const level = getProtectionLevel(status);
    const descriptions = {
        none: "Fully editable - no restrictions",
        scope: "Scope-locked - cannot add new deliverables",
        hard: `Hard-locked - requires ${tagPrefix}unlock-reason to modify`,
    };
    return {
        level,
        description: descriptions[level],
        canAddDeliverables: level === "none",
        requiresUnlock: level === "hard",
    };
}
//# sourceMappingURL=validator.js.map