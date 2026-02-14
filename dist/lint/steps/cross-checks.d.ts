/**
 * Cross-file lint checks for vitest-cucumber compatibility.
 *
 * These checks compare a .feature file with its corresponding .steps.ts
 * file to detect mismatches in structure (Rule/And/ScenarioOutline patterns).
 */
import type { LintViolation } from '../../validation-schemas/lint.js';
/**
 * Check 1: Detect function params used inside ScenarioOutline blocks.
 *
 * In vitest-cucumber, ScenarioOutline step callbacks receive values via a
 * `variables` object — NOT via function parameters. Using (_ctx, value: string)
 * as callback args is the #1 trap: the value will be undefined at runtime.
 *
 * Detection: Find ScenarioOutline/RuleScenarioOutline blocks in step files,
 * then within those blocks look for step callbacks with a second positional
 * parameter after _ctx.
 *
 * The heuristic is conservative: we only flag when we see an explicit second
 * positional parameter pattern. False negatives are acceptable; false positives
 * are not.
 */
export declare function checkScenarioOutlineFunctionParams(featureContent: string, stepContent: string, stepFilePath: string): readonly LintViolation[];
/**
 * Check 2: Detect missing And destructuring.
 *
 * If a feature file has And steps, the step definition must destructure And
 * from the scenario callback. Using Then(...) for And steps causes
 * StepAbleUnknowStepError at runtime.
 */
export declare function checkMissingAndDestructuring(featureContent: string, stepContent: string, stepFilePath: string): readonly LintViolation[];
/**
 * Check 3: Detect missing Rule() wrapper.
 *
 * If a feature file has Rule: blocks, the step definition must destructure
 * Rule from describeFeature and wrap scenarios with Rule('name', ...).
 * Using top-level Scenario() instead of RuleScenario() causes step
 * matching failures.
 */
export declare function checkMissingRuleWrapper(featureContent: string, stepContent: string, stepFilePath: string): readonly LintViolation[];
/**
 * Run all cross-file checks on a paired feature + step file.
 */
export declare function runCrossChecks(featureContent: string, stepContent: string, stepFilePath: string): readonly LintViolation[];
//# sourceMappingURL=cross-checks.d.ts.map