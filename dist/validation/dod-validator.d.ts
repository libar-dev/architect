/**
 * @libar-docs
 * @libar-docs-validation
 * @libar-docs-pattern DoDValidator
 * @libar-docs-status completed
 * @libar-docs-uses DoDValidationTypes, GherkinTypes, DualSourceExtractor
 * @libar-docs-extract-shapes isDeliverableComplete, hasAcceptanceCriteria, validateDoDForPhase, validateDoD
 *
 * ## DoDValidator - Definition of Done Validation
 *
 * Validates that completed phases meet Definition of Done criteria:
 * 1. All deliverables must have "complete" status
 * 2. At least one @acceptance-criteria scenario must exist
 *
 * ### When to Use
 *
 * - Pre-release validation to ensure phases are truly complete
 * - CI pipeline checks to prevent premature "done" declarations
 * - Manual DoD checks during code review
 */
import type { Deliverable, ScannedGherkinFile } from '../validation-schemas/index.js';
import type { DoDValidationResult, DoDValidationSummary } from './types.js';
/**
 * Check if a deliverable status indicates completion
 *
 * Matches various completion patterns including text ("Complete", "Done")
 * and symbols (✓, ✅, ☑).
 *
 * @param deliverable - The deliverable to check
 * @returns True if the deliverable is complete
 *
 * @example
 * ```typescript
 * isDeliverableComplete({ name: "Feature X", status: "Complete", tests: 5, location: "src/" })
 * // => true
 *
 * isDeliverableComplete({ name: "Feature Y", status: "In Progress", tests: 0, location: "src/" })
 * // => false
 * ```
 */
export declare function isDeliverableComplete(deliverable: Deliverable): boolean;
/**
 * Check if a feature has @acceptance-criteria scenarios
 *
 * Scans scenarios for the @acceptance-criteria tag, which indicates
 * BDD-driven acceptance tests.
 *
 * @param feature - The scanned feature file to check
 * @returns True if at least one @acceptance-criteria scenario exists
 */
export declare function hasAcceptanceCriteria(feature: ScannedGherkinFile): boolean;
/**
 * Extract acceptance criteria scenario names from a feature
 *
 * @param feature - The scanned feature file
 * @returns Array of scenario names with @acceptance-criteria tag
 */
export declare function extractAcceptanceCriteriaScenarios(feature: ScannedGherkinFile): readonly string[];
/**
 * Validate DoD for a single phase/pattern
 *
 * Checks:
 * 1. All deliverables have "complete" status
 * 2. At least one @acceptance-criteria scenario exists
 *
 * @param patternName - Name of the pattern being validated
 * @param phase - Phase number being validated
 * @param feature - The scanned feature file with deliverables and scenarios
 * @returns DoD validation result
 */
export declare function validateDoDForPhase(patternName: string, phase: number, feature: ScannedGherkinFile): DoDValidationResult;
/**
 * Validate DoD across multiple phases
 *
 * Filters to completed phases and validates each against DoD criteria.
 * Optionally filter to specific phases using phaseFilter.
 *
 * @param features - Array of scanned feature files
 * @param phaseFilter - Optional array of phase numbers to validate (validates all if empty)
 * @returns Aggregate DoD validation summary
 *
 * @example
 * ```typescript
 * // Validate all completed phases
 * const summary = validateDoD(features);
 *
 * // Validate specific phase
 * const summary = validateDoD(features, [14]);
 * ```
 */
export declare function validateDoD(features: readonly ScannedGherkinFile[], phaseFilter?: readonly number[]): DoDValidationSummary;
/**
 * Format DoD validation summary for console output
 *
 * @param summary - DoD validation summary to format
 * @returns Multi-line string for pretty printing
 */
export declare function formatDoDSummary(summary: DoDValidationSummary): string;
//# sourceMappingURL=dod-validator.d.ts.map