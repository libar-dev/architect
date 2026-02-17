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
 * Check 12: Detect quoted values in Scenario Outline steps (feature-file side).
 *
 * When a Scenario Outline's steps use quoted values (e.g., "foo") instead of
 * angle-bracket placeholders (e.g., <column>), this suggests the author is
 * using the Scenario pattern (Cucumber expression matching) instead of the
 * ScenarioOutline pattern (variable substitution). This is the feature-file
 * side of the Two-Pattern Problem — the step-file side is caught by
 * scenario-outline-function-params.
 *
 * Detection: Find Scenario Outline sections in the feature file, extract the
 * Examples table column names, then check if step lines within those sections
 * contain quoted values whose content matches a column name. Only those are
 * flagged — constant quoted values (e.g., "error") that don't correspond to
 * any Examples column are intentionally literal and should not be placeholders.
 *
 * This is a cross-file check because it's only meaningful when a paired step
 * file exists (roadmap specs without implementations shouldn't be flagged).
 * The _stepContent parameter is unused but maintains the cross-check signature.
 */
export declare function checkOutlineQuotedValues(featureContent: string, _stepContent: string, stepFilePath: string, featurePath?: string): readonly LintViolation[];
/**
 * Run all cross-file checks on a paired feature + step file.
 */
export declare function runCrossChecks(featureContent: string, stepContent: string, stepFilePath: string, featurePath?: string): readonly LintViolation[];
//# sourceMappingURL=cross-checks.d.ts.map