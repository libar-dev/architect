/**
 * @architect
 * @architect-pattern ValidationModule
 * @architect-validation
 * @architect-status completed
 * @architect-role:barrel
 * @architect-bounded-context:validation
 * @architect-uses DoDValidator, AntiPatternDetector, DoDValidationTypes
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

// Types
export type {
  AntiPatternId,
  AntiPatternThresholds,
  AntiPatternViolation,
  DoDValidationResult,
  DoDValidationSummary,
  WithTagRegistry,
} from './types.js';

export { AntiPatternThresholdsSchema, DEFAULT_THRESHOLDS, getPhaseStatusEmoji } from './types.js';

// DoD Validator
export {
  isDeliverableComplete,
  hasAcceptanceCriteria,
  extractAcceptanceCriteriaScenarios,
  validateDoDForPhase,
  validateDoD,
  formatDoDSummary,
} from './dod-validator.js';

// Anti-Pattern Detector
export {
  type AntiPatternDetectionOptions,
  detectProcessInCode,
  detectMagicComments,
  detectScenarioBloat,
  detectMegaFeature,
  detectDuplicateFeatureIdentities,
  detectAntiPatterns,
  formatAntiPatternReport,
  toValidationIssues,
} from './anti-patterns.js';
