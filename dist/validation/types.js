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
/**
 * Zod schema for anti-pattern thresholds
 *
 * Configurable limits for detecting anti-patterns.
 */
export const AntiPatternThresholdsSchema = z.object({
    /** Maximum scenarios per feature file before warning */
    scenarioBloatThreshold: z.number().int().positive().default(20),
    /** Maximum lines per feature file before warning */
    megaFeatureLineThreshold: z.number().int().positive().default(500),
    /** Maximum magic comments before warning */
    magicCommentThreshold: z.number().int().positive().default(5),
});
/**
 * Default thresholds for anti-pattern detection
 */
export const DEFAULT_THRESHOLDS = {
    scenarioBloatThreshold: 20,
    megaFeatureLineThreshold: 500,
    magicCommentThreshold: 5,
};
/**
 * Completion status detection patterns
 *
 * Various ways to indicate a deliverable is complete.
 */
export const COMPLETION_PATTERNS = [
    // Text patterns (case-insensitive)
    'complete',
    'completed',
    'done',
    'finished',
    'yes',
    // Emoji/symbol patterns
    '✓',
    '✔',
    '✅',
    '☑',
    // Checkmark unicode variants
    '\u2713', // ✓
    '\u2714', // ✔
    '\u2611', // ☑
];
/**
 * In-progress status detection patterns
 *
 * Status values that indicate work is ongoing.
 */
export const IN_PROGRESS_PATTERNS = [
    'in-progress',
    'in progress',
    'active',
    'wip',
    'partial',
    'started',
    // Emoji patterns
    '🔄',
    '⏳',
    '🚧',
];
/**
 * Pending status detection patterns
 *
 * Status values that indicate work hasn't started.
 */
export const PENDING_PATTERNS = [
    'pending',
    'todo',
    'planned',
    'not started',
    'no',
    // Emoji patterns
    '⏹',
    '⬜',
    '❌',
];
//# sourceMappingURL=types.js.map