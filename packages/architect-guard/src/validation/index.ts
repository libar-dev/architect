/**
 * @architect
 * @architect-pattern ValidationModule
 * @architect-validation
 * @architect-status completed
 * @architect-role:barrel
 * @architect-bounded-context:validation
 * @architect-uses AntiPatternDetector, AntiPatternValidationTypes
 *
 * ## ValidationModule - Anti-Pattern Detection
 *
 * Barrel export for validation module providing:
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
  WithTagRegistry,
} from './types.js';

export { AntiPatternThresholdsSchema, DEFAULT_THRESHOLDS } from './types.js';

// Anti-Pattern Detector
export {
  type AntiPatternDetectionOptions,
  detectProcessInCode,
  detectRemovedTags,
  detectGherkinTagSpaceForm,
  detectMagicComments,
  detectScenarioBloat,
  detectMegaFeature,
  detectDuplicateFeatureIdentities,
  detectAntiPatterns,
  formatAntiPatternReport,
  toValidationIssues,
} from './anti-patterns.js';

export {
  detectArchitectTagsAfterProse,
  detectMissingArchitectMarker,
  detectTsUsesSpaceForm,
} from './ts-annotation-integrity.js';
