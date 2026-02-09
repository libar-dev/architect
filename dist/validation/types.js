/**
 * @libar-docs
 * @libar-docs-validation
 * @libar-docs-pattern DoDValidationTypes
 * @libar-docs-status completed
 * @libar-docs-used-by DoDValidator, AntiPatternDetector
 * @libar-docs-extract-shapes AntiPatternId, AntiPatternViolation, AntiPatternThresholds, AntiPatternThresholdsSchema, DEFAULT_THRESHOLDS, DoDValidationResult, DoDValidationSummary, getPhaseStatusEmoji, WithTagRegistry
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
 * Get status emoji for phase-level aggregates.
 *
 * @param allComplete - Whether all patterns in the phase are complete
 * @param anyActive - Whether any patterns in the phase are active/in-progress
 * @returns Status emoji: ✅ if all complete, 🚧 if any active, 📋 otherwise
 */
export function getPhaseStatusEmoji(allComplete, anyActive) {
    if (allComplete)
        return '✅';
    if (anyActive)
        return '🚧';
    return '📋';
}
//# sourceMappingURL=types.js.map