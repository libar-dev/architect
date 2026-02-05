/**
 * @libar-docs
 * @libar-docs-validation
 * @libar-docs-pattern DoDValidationTypes
 * @libar-docs-status completed
 * @libar-docs-used-by DoDValidator, AntiPatternDetector
 * @libar-docs-extract-shapes AntiPatternId, AntiPatternViolation, AntiPatternThresholds, DoDValidationResult, DoDValidationSummary, COMPLETION_PATTERNS
 *
 * ## DoDValidationTypes - Type Definitions for DoD Validation
 *
 * Types and schemas for Definition of Done (DoD) validation and anti-pattern detection.
 * Follows the project's schema-first pattern with Zod for runtime validation.
 *
 * ### When to Use
 *
 * - When implementing DoD validation logic
 * - When extending anti-pattern detection rules
 * - When consuming validation results in CLI or reports
 */
import { z } from 'zod';
import type { Deliverable } from '../validation-schemas/dual-source.js';
import type { TagRegistry } from '../validation-schemas/tag-registry.js';
/**
 * Base interface for options that accept a TagRegistry for prefix-aware behavior.
 *
 * Many validation functions need to be aware of the configured tag prefix
 * (e.g., "@libar-docs-" vs "@docs-"). This interface provides a consistent
 * way to pass that configuration.
 *
 * ### When to Use
 *
 * Extend this interface when creating options for functions that:
 * - Generate error messages referencing tag names
 * - Detect tags in source code
 * - Validate tag formats
 *
 * @example
 * ```typescript
 * export interface MyValidationOptions extends WithTagRegistry {
 *   readonly strict?: boolean;
 * }
 * ```
 */
export interface WithTagRegistry {
    /** Tag registry for prefix-aware behavior (defaults to @libar-docs- if not provided) */
    readonly registry?: TagRegistry;
}
/**
 * Anti-pattern rule identifiers
 *
 * Each ID corresponds to a specific violation of the dual-source
 * documentation architecture or process hygiene.
 */
export type AntiPatternId = 'tag-duplication' | 'process-in-code' | 'magic-comments' | 'scenario-bloat' | 'mega-feature';
/**
 * Zod schema for anti-pattern thresholds
 *
 * Configurable limits for detecting anti-patterns.
 */
export declare const AntiPatternThresholdsSchema: z.ZodObject<{
    scenarioBloatThreshold: z.ZodDefault<z.ZodNumber>;
    megaFeatureLineThreshold: z.ZodDefault<z.ZodNumber>;
    magicCommentThreshold: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type AntiPatternThresholds = z.infer<typeof AntiPatternThresholdsSchema>;
/**
 * Default thresholds for anti-pattern detection
 */
export declare const DEFAULT_THRESHOLDS: AntiPatternThresholds;
/**
 * Anti-pattern detection result
 *
 * Reports a specific anti-pattern violation with context
 * for remediation.
 */
export interface AntiPatternViolation {
    /** Anti-pattern identifier */
    readonly id: AntiPatternId;
    /** Human-readable description */
    readonly message: string;
    /** File where violation was found */
    readonly file: string;
    /** Line number (if applicable) */
    readonly line?: number;
    /** Severity (error = architectural violation, warning = hygiene issue) */
    readonly severity: 'error' | 'warning';
    /** Fix guidance */
    readonly fix?: string;
}
/**
 * DoD validation result for a single phase/pattern
 *
 * Reports whether a completed phase meets Definition of Done criteria:
 * 1. All deliverables must have "complete" status
 * 2. At least one @acceptance-criteria scenario must exist
 */
export interface DoDValidationResult {
    /** Pattern name being validated */
    readonly patternName: string;
    /** Phase number being validated */
    readonly phase: number;
    /** True if all DoD criteria are met */
    readonly isDoDMet: boolean;
    /** All deliverables from Background table */
    readonly deliverables: readonly Deliverable[];
    /** Deliverables that are not yet complete */
    readonly incompleteDeliverables: readonly Deliverable[];
    /** True if no @acceptance-criteria scenarios found */
    readonly missingAcceptanceCriteria: boolean;
    /** Human-readable validation messages */
    readonly messages: readonly string[];
}
/**
 * Aggregate DoD validation summary
 *
 * Summarizes validation across multiple phases for CLI output.
 */
export interface DoDValidationSummary {
    /** Per-phase validation results */
    readonly results: readonly DoDValidationResult[];
    /** Total phases validated */
    readonly totalPhases: number;
    /** Phases that passed DoD */
    readonly passedPhases: number;
    /** Phases that failed DoD */
    readonly failedPhases: number;
}
/**
 * Completion status detection patterns
 *
 * Various ways to indicate a deliverable is complete.
 */
export declare const COMPLETION_PATTERNS: readonly ["complete", "completed", "done", "finished", "yes", "✓", "✔", "✅", "☑", "✓", "✔", "☑"];
/**
 * In-progress status detection patterns
 *
 * Status values that indicate work is ongoing.
 */
export declare const IN_PROGRESS_PATTERNS: readonly ["in-progress", "in progress", "active", "wip", "partial", "started", "🔄", "⏳", "🚧"];
/**
 * Pending status detection patterns
 *
 * Status values that indicate work hasn't started.
 */
export declare const PENDING_PATTERNS: readonly ["pending", "todo", "planned", "not started", "no", "⏹", "⬜", "❌"];
//# sourceMappingURL=types.d.ts.map