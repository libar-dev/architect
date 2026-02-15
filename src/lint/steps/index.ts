/**
 * vitest-cucumber step lint module.
 *
 * Provides static analysis for vitest-cucumber feature/step compatibility.
 * Catches common traps that cause runtime failures:
 * - {string} function params inside ScenarioOutline (should use variables)
 * - Missing And destructuring (causes StepAbleUnknowStepError)
 * - Missing Rule() wrapper (causes step matching failures)
 * - # in descriptions (terminates Gherkin parser context)
 * - Regex step patterns (not supported by vitest-cucumber)
 * - {phrase} usage (not supported by vitest-cucumber)
 */

// Types
export type { StepLintRule, FeatureStepPair } from './types.js';
export { STEP_LINT_RULES } from './types.js';

// Runner
export { runStepLint } from './runner.js';
export type { StepLintOptions } from './runner.js';

// Feature checks (for targeted use)
export {
  checkHashInDescription,
  checkDuplicateAndSteps,
  checkDollarInStepText,
  checkHashInStepText,
  checkKeywordInDescription,
  runFeatureChecks,
} from './feature-checks.js';

// Step checks (for targeted use)
export {
  checkRegexStepPatterns,
  checkPhraseUsage,
  checkRepeatedStepPattern,
  runStepChecks,
} from './step-checks.js';

// Cross-file checks (for targeted use)
export {
  checkScenarioOutlineFunctionParams,
  checkMissingAndDestructuring,
  checkMissingRuleWrapper,
  checkOutlineQuotedValues,
  runCrossChecks,
} from './cross-checks.js';

// Pair resolver (for targeted use)
export { extractFeaturePath, resolveFeatureStepPairs } from './pair-resolver.js';

// Utilities
export { countBraceBalance } from './utils.js';
