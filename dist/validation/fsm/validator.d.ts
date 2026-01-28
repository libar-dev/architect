/**
 * @libar-docs
 * @libar-docs-validation
 * @libar-docs-pattern FSMValidator
 * @libar-docs-status active
 * @libar-docs-implements PhaseStateMachineValidation
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
import { type ProcessStatusValue } from '../../taxonomy/index.js';
import type { TagRegistry } from '../../validation-schemas/tag-registry.js';
import { type ProtectionLevel } from './states.js';
/**
 * Result of validating a status value
 */
export interface StatusValidationResult {
    /** Whether the status is valid */
    valid: boolean;
    /** The status that was validated */
    status: string;
    /** Error message if invalid */
    error?: string;
    /** Warnings (valid but with caveats) */
    warnings?: string[];
}
/**
 * Result of validating a status transition
 */
export interface TransitionValidationResult {
    /** Whether the transition is valid */
    valid: boolean;
    /** The source status */
    from: ProcessStatusValue;
    /** The target status */
    to: ProcessStatusValue;
    /** Error message if invalid */
    error?: string;
    /** Valid alternatives if transition is invalid */
    validAlternatives?: readonly ProcessStatusValue[];
}
/**
 * Result of validating completion metadata
 */
export interface CompletionMetadataValidationResult {
    /** Whether the metadata is valid/complete */
    valid: boolean;
    /** Warnings for missing optional metadata */
    warnings: string[];
}
/**
 * Pattern metadata for completion validation
 */
export interface PatternMetadata {
    status: string;
    completed?: string;
    effortActual?: string;
    effortPlanned?: string;
}
/**
 * Options for FSM validation functions
 */
export interface FSMValidationOptions {
    /** Tag registry for prefix-aware error messages (optional) */
    readonly registry?: TagRegistry;
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
export declare function validateStatus(status: string, options?: FSMValidationOptions): StatusValidationResult;
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
export declare function validateTransition(from: string, to: string): TransitionValidationResult;
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
export declare function validateCompletionMetadata(pattern: PatternMetadata, options?: FSMValidationOptions): CompletionMetadataValidationResult;
/**
 * Full validation of a pattern's status and metadata
 *
 * Combines status validation with completion metadata checks.
 *
 * @param pattern - Pattern metadata to validate
 * @param options - Optional validation options with registry
 * @returns Combined validation result
 */
export declare function validatePatternStatus(pattern: PatternMetadata, options?: FSMValidationOptions): {
    valid: boolean;
    statusResult: StatusValidationResult;
    completionResult: CompletionMetadataValidationResult;
    allWarnings: string[];
};
/**
 * Get a summary of FSM protection for a status
 *
 * @param status - Status to describe
 * @param options - Optional validation options with registry
 * @returns Human-readable protection description
 */
export declare function getProtectionSummary(status: ProcessStatusValue, options?: FSMValidationOptions): {
    level: ProtectionLevel;
    description: string;
    canAddDeliverables: boolean;
    requiresUnlock: boolean;
};
//# sourceMappingURL=validator.d.ts.map