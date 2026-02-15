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
export type { StepLintRule, FeatureStepPair } from './types.js';
export { STEP_LINT_RULES } from './types.js';
export { runStepLint } from './runner.js';
export type { StepLintOptions } from './runner.js';
export { checkHashInDescription, checkDuplicateAndSteps, checkDollarInStepText, runFeatureChecks, } from './feature-checks.js';
export { checkRegexStepPatterns, checkPhraseUsage, runStepChecks } from './step-checks.js';
export { checkScenarioOutlineFunctionParams, checkMissingAndDestructuring, checkMissingRuleWrapper, runCrossChecks, } from './cross-checks.js';
export { extractFeaturePath, resolveFeatureStepPairs } from './pair-resolver.js';
//# sourceMappingURL=index.d.ts.map