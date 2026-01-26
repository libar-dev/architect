/**
 * @libar-docs
 * @libar-docs-validation
 * @libar-docs-pattern ValidationModule
 * @libar-docs-status completed
 *
 * ## ValidationModule - DoD Validation and Anti-Pattern Detection
 *
 * Barrel export for validation module providing:
 * - Definition of Done (DoD) validation for completed phases
 * - Anti-pattern detection for documentation architecture violations
 *
 * ### When to Use
 *
 * - Import validation functions for CLI integration
 * - Import types for extending validation rules
 */
export type { AntiPatternId, AntiPatternThresholds, AntiPatternViolation, DoDValidationResult, DoDValidationSummary, WithTagRegistry, } from "./types.js";
export { AntiPatternThresholdsSchema, DEFAULT_THRESHOLDS, COMPLETION_PATTERNS, IN_PROGRESS_PATTERNS, PENDING_PATTERNS, } from "./types.js";
export { isDeliverableComplete, hasAcceptanceCriteria, extractAcceptanceCriteriaScenarios, validateDoDForPhase, validateDoD, formatDoDSummary, } from "./dod-validator.js";
export { type AntiPatternDetectionOptions, detectTagDuplication, detectProcessInCode, detectMagicComments, detectScenarioBloat, detectMegaFeature, detectAntiPatterns, formatAntiPatternReport, toValidationIssues, } from "./anti-patterns.js";
export * from "./fsm/index.js";
//# sourceMappingURL=index.d.ts.map